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

| id | title | status | source | disposed by |
|---|---|---|---|---|
| L01 | archē is the root answer form | stubbed | author | `disposition-graph/node` |
| L02 | the root is agency | stubbed | author | `public/agency` |
| L03 | graphs as packages, import-path ids, mount shim | stubbed | author | `disposition-graph/namespaces`, `disposition.yaml` |
| L04 | persistence: own ref, compare-and-swap landing, no PR | stubbed | author + proposal | `disposition-graph/persistence` |
| L05 | implementation sessions read projections, never the graph | stubbed | author | `disposition-graph/projection` |
| L06 | traditions on instrumenting first principles | stubbed, readings owed | author | `disposition-graph/instruments` |
| L07 | cadence review of archai rejected; expiry stays on delegated authority | stubbed | author + proposal | `disposition-graph/instruments` |
| L08 | re-grasp triggers are events | stubbed | author + proposal | `disposition-graph/instruments` |
| L09 | tradition readings carry authority; deferred reading recurses | stubbed | author + proposal | `disposition-graph/readings` |
| L10 | the bootstrap grant | stubbed | author | `disposition-graph/bootstrap` |
| L11 | reconciliation runs in both directions | stubbed | author + proposal | `disposition-graph/work-loop` |
| L12 | bootstrap is onboarding; purpose first | stubbed, purpose is a proposal | author | `disposition-graph/purpose` and children |
| L13 | rank serves onboarding | stubbed | author + proposal | `disposition-graph/attention` |
| L14 | the schema nodes | stubbed | proposal | `disposition-graph/model` and children |
| L15 | `/align` is materialized from the ratified schema | open | author | the skill on this ref |
| L16 | exit criteria | stubbed | proposal | `disposition-graph/bootstrap` instrument |
| L17 | legacy nodes are evidence, never imported | stubbed | proposal | `disposition-graph/legacy` |
| L18 | README, description, and tags are projections | open | author | `disposition-graph/projection`, a bite on `main` |
| L19 | the revision-2 model page is input, not doctrine | informational | stub | deleted with this ledger |
| L20 | delete this ledger | open | author | |
| L21 | definitions of "appropriate" unit, model, and effort for delegation | open | author | a node under `growth` |
| L22 | vocabulary and traditions on the onboarding path, with their own layout | stubbed | author | `defines` field; the browser |
| L23 | token-efficiency rule for bootstrap sessions | recorded in CLAUDE.md | author | `disposition-graph/bootstrap` |
| L24 | scope node and coverage review | open | author | `disposition-graph/scope` |
| L25 | the disposition ref stores the graphs and only the graphs | stubbed | author | `disposition-graph/materialization`, `persistence` |
| L26 | graph tooling is justified by disposition like all materialized implementation | stubbed | author | `disposition-graph/materialization` |
| L27 | materialized implementation is organized as a `packages/` monorepo | stubbed | author | `disposition-graph/materialization`, a reading owed |
| L28 | shim: greenfield implementation on a third ref, swapped with `main` at exit | stubbed | author | `disposition-graph/materialization`; the `greenfield` ref |
| L29 | shimmed code review for every bootstrap landing; review doctrine before exit | stubbed | author | `disposition-graph/review`; the incumbent detached review instrument as shim |

## L01 archē is the root answer form

**Source.** Author: "I prefer the greek word archē over 'care' - confirm that
this word fits the usage." AI confirmed it fits better than "care".

**Content.** The five answer forms are target, rule, assumption, archē, and
reading (L09). An archē is held, not derived: Aristotle gives the word its
three senses at once in Metaphysics V.1 (starting point of derivation, origin
of motion or action, rule as in monarchy); Posterior Analytics I.3 makes first
principles indemonstrable; Nicomachean Ethics I.4 starts ethics from the
"that", held by habituation. Consequences that follow from the word rather
than needing statement: only the author can hold one, the AI can never derive
one, and nothing ranks above one. Spell `arche` in machine fields, archē in
prose.

## L02 the root is agency

**Source.** Author: "Is 'agency' a better word for 'philosophical-mobility',
or is there a better reference to tradition? IMPORTANT: we must not be bound
by legacy graph structures such as ID's or node decomposition. Consider
alternate id and wording for the question - it is vague. Consider the
relationship between agency and archē." Decided 2026-09-02: "agency - make
reference to authorship in the body".

**Content.** Agency and archē are one thing in Aristotle: Eudemian Ethics II.6
says a person is an archē of actions the way the archai of mathematics are
starting points of proofs (also Nicomachean Ethics III.3 and III.5). Politics
I.4, 1253b33 to 1254a1, contains the delegation case. The modal content,
capacity rather than exercise, comes from Pettit's freedom as non-domination
and Sen's capability approach; Hirschman supplies exit and voice. Korsgaard's
Self-Constitution grounds "authorship", which the body references. Node:
`commons.systems/public/agency`, question "Who is the origin of what is done
in my name?", stubbed deferred; readings under it for Aristotle and Pettit are
stubbed; Sen, Hirschman, and Korsgaard readings are owed.

## L03 graphs as packages, import-path ids, mount shim

**Source.** Author: the target state has the author's personal disposition in
a repo that does not exist yet, distinct from this project's disposition; the
project has no agency and no archē of its own; a self-liquidating shim must
exist before exit. Decided 2026-09-02: "just like a Go repo can have multiple
packages, a repo with a dispatch ref may have multiple graphs. For now,
commons.systems repo will have commons.systems/disposition-graph and
commons.systems/public (named public because it will be the portion of my
personal graph that I make public), but the target state must be recorded for
the personal graph to eventually move to natb1.com/public. The hypothetical
node with id `purpose` would be addressed
commons.systems/disposition-graph/purpose."

**Content.** Recorded in `disposition.yaml` (module, ref, graphs, the
`public` graph's `target` and liquidation condition) and in
`disposition-graph/namespaces`. Traditions to record as readings: Go modules
(`module`, `replace`, workspaces); Unix mount namespaces. The liquidation is a
directory move plus a prefix rewrite of ids, mechanical.

## L04 persistence: own ref, compare-and-swap landing, no PR

**Source.** Author: skeptical of landing graph updates via PR; the PR's
function is review of the materialized implementation; in the legacy
greenfield PRs were declined because the review was redundant with the
interview and commits to the implementation's ref caused unnecessary conflict
checks; "Think ahead to multiple agents making concurrent graph updates while
also pushing reconciled implementation." AI evaluated; the PR did not survive.
The author's later namespace ruling assumes a `disposition` ref.

**Content.** In `disposition-graph/persistence`. The ref and the worktree
`.claude/worktrees/disposition` were created 2026-09-02 under L10. Until the
lander exists, bootstrap landings are plain `git commit` and `git push` to
`disposition`, no PR. Ratified stamps are written only by `tools/ratify.mjs`,
run by the author. Tooling shim: `tools/*.mjs` import `yaml` from an ancestor
`node_modules`; the ref has no dependencies of its own yet.

## L05 implementation sessions read projections, never the graph

**Source.** Author: "an implementation session (frontier bite) does not read
the worktree directly. instead graph context is a materialized projection via
rules and CLAUDE.local.md".

**Content.** In `disposition-graph/projection`. Global-tier rules materialize
into committed rules on `main`; a bite's ancestry materializes into its
worktree's `CLAUDE.local.md` at provisioning, pinned at a graph commit; writes
from a bite go through narrow lander verbs. Alignment sessions are the only
sessions that open the graph.

## L06 traditions on instrumenting first principles

**Source.** Author: "These tradition references are good. They must be
recorded before bootstrap exit." And: "all of these tradition references must
be recorded before bootstrap exit."

**Content.** Summarized in `disposition-graph/instruments`; each is owed a
reading node (L09) under that node or under `public/agency`:
- Posterior Analytics I.3 and II.19: first principles are indemonstrable and
  grasped by induction from experience; re-grasped, not re-derived.
- Nicomachean Ethics I.4: ethics begins from the "that".
- Peirce, The Fixation of Belief (1877): inquiry begins with the irritation of
  genuine doubt, which comes from surprise; manufactured doubt is paper doubt.
  Supports rejecting cadence review (L07).
- Rawls, A Theory of Justice (1971), and Goodman, Fact, Fiction, and Forecast
  (1955): reflective equilibrium; Daniels (1979), wide reflective equilibrium
  admits alternative principles, so an adversarial proposal is
  tradition-endorsed.
- Kuhn, The Structure of Scientific Revolutions (1962): anomalies accumulate
  to crisis; a threshold trigger, not a calendar.
- Planned Parenthood v. Casey (1992), factors for overruling precedent:
  workability, reliance, doctrinal development, changed facts.
- IEC 61508 proof-test interval: applies to instruments and delegated
  authority, not to archai (L07).
- OSHA process safety management, management of change: a change triggers
  hazard re-analysis; incident investigation triggers principle review.
- Seneca, De Ira III.36; the Ignatian examen: periodic review of conduct
  against principle; the cadence is on evidence review, not on the principle.
- Jefferson to Madison, 6 September 1789; New York Constitution Article XIX
  section 2: the periodic-convention strand, diverged from (L07).
- Sunset clauses: delegated and emergency powers expire unless renewed.

## L07 cadence review of archai rejected; expiry stays on delegated authority

**Source.** Author: "I am sceptical of cadence review - not that conventions
aren't called to re-evaluate constitutions in practice ... on a cadence (which
is rejected and must be recorded as a divergence from tradition before
bootstrap exits)". And, 2026-09-02: "at least one mechanism for review of
delegated dispositions is when a proposal that contradicts doctrine is made.
Proposals are necessarily sourced from delegated dispositions and so trigger
a review. Other mechanisms can be evaluated".

**Content.** In `disposition-graph/instruments`: an archē is re-grasped on
events, never on a calendar; diverged from the periodic-convention strand,
adopted from Peirce. A proposal that contradicts doctrine opens review of the
delegated disposition it was made under. Expiry stays on delegated authority
and on assessments of lower answers. Open: whether a delegated stamp itself
sunsets, or is reviewed only on the contradiction trigger.

## L08 re-grasp triggers are events

**Source.** Author: a proposal rejected for conflict with the archē is one
valid mechanical trigger; asks what else the references say; deferred reading
is recursive and each primary source is an opportunity for re-grasping.

**Content.** In `disposition-graph/instruments`, five triggers: a proposal
under the archē rejected for conflict with it; a failed assumption in the
subtree; an action taken under it that the author rejects at review;
anomalies past a ratified threshold; a reading under it re-ratified with a
changed verdict, including recursive readings.

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
re-grasping." And, 2026-09-02: "help me understand the function of new reading
primitives. What does this buy that is not had by 'deference to a tradition
(supporting or contradicting) is office-hours/reading frontier'?"

**Content.** In `disposition-graph/readings`, stubbed as nodes with `source`
and `relation`. What the node encoding buys over stamped field entries with a
derived reading frontier: a shared source stored once and refined under each
node it grounds; nesting, which recursion needs; a hash and pin of its own, so
a changed reading is distinguishable from a changed answer; one write path,
queue, and stamp vocabulary. The field encoding is workable and was the
author's framing; the author rules. Six readings are stubbed on this ref as
the first instances.

## L10 the bootstrap grant

**Source.** Author: "For the purpose of bootstrap procedure and onboarding AI
has broad authority to stub dispositions and materialized implementation and
place stub on ledger for ratification before bootstrap exit."

**Content.** In `disposition-graph/bootstrap`. Every stub is stamped deferred,
listed here, and ratified, amended, or pruned before exit. The grant decouples
the critical path to `/align` from the onboarding order.

## L11 reconciliation runs in both directions

**Source.** Author: "Doctrine/implementation for reconciler bite work to work
in conjunction with office hours review to resolve in both directions: from
disposition -> unimplemented materialized implementation AND from
implementation not supported by disposition (including incumbent code/skills/
rules and legacy graph) -> new disposition or pruned implementation."

**Content.** In `disposition-graph/work-loop`, with the coverage proposal:
an artifact no disposition cites or instruments is a prune-by-default
proposal; this subsumes legacy transcription and the drain.

## L12 bootstrap is onboarding; purpose first

**Source.** Author: "organize bootstrapping around progressive disclosure.
Then, it makes sense to start with questions about the core value of the repo
- what is this repo and why does it matter? The projected documentation
artifacts for these first nodes serve as repo README from which the full repo
can be explored via graph browser artifact (to be recorded and materialized
before bootstrap exit)." Approved 2026-09-02: "Onboarding as the ordering
principle: approved, confirm recorded as bootstrap operation". The purpose, in
the author's words: "The target audience is humans that want to do a) primary
function: something like 'spec driven development' (validate this reference
to tradition) in order to manage alignment of long horizon AI agent workflows
or 'software factories' (also validate this reference to tradition). Target
audience may arrive via AI tasked with this goal. The hypothesis is that the
solution for this primary function will also serve related functions of b)
serving as a knowledge store - something like a projection of the author's
hexis (validate this reference to tradition) c) help manage capture of author
intention in the variety of ways it occurs in daily life via a variety of
institutions, not just mis-aligned AI writing software (provide references to
tradition for this). If there are other recorded functions in the incumbent
code/graph then present for review to ensure full coverage of scope. 'Repo
scope' may be a better way to describe the onboarding starting place rather
than 'repo value/purpose', but help me think that through given the
description of the target audience." Also: "Do not accept incumbent code such
as README.md as doctrine - it is likely stale but can provide context."

**Content.** `disposition-graph/purpose` is written as a proposal in the
author's words for ratification; `audience`, `knowledge-store` (assumption),
`capture` (assumption), and `capture-traditions` (an open question with the
candidate readings as its proposal) are stubbed under it, as are the readings
`spec-driven-development` (adopted, with divergence), `software-factories`
(diverged), `aristotle-hexis` (adopted), and `srs-introduction` (adopted: the
requirements-specification tradition opens with purpose, scope, audience,
definitions, which settles "scope or purpose": both, in that order). The scope
node waits on the coverage survey (L24).

## L13 rank serves onboarding

**Source.** Author: "New doctrine: node ranking serves an additional function
- to guide onboarding. Bootstrap follows an onboarding path steered by the
author, this is reflected in node ranking which later steers frontier
attention and other recorded functions of ranking."

**Content.** In `disposition-graph/attention`: rank is one fact with three
readings; the onboarding path is the `under` tree walked in rank order; the
author's choice of what comes next is a boost ratification.

## L14 the schema nodes

**Content.** Stubbed under `disposition-graph/model`, all deferred: node,
under, authority, growth, projection, persistence, namespaces, attention,
instruments, readings, work-loop, legacy. They live in the project's graph,
not the personal one, because the schema is what the repository offers. Each
tool is the instrument of one of them: validator (node), lander and ratify
command (persistence, authority), projector and browser (projection), rank and
frontier derivation (attention, work-loop), the reconciler tick (work-loop).
Frontmatter fields as stubbed: question, form, authority, under, tier, boost,
cites, instrument, after, source, relation, defines, ledger. The `defines`
field (L22) and the `ledger` field are bootstrap additions to the revision-2
model.

## L15 `/align` is materialized from the ratified schema

**Source.** Author: "we need to find a critical path to a materialized
`/align` skill so that we can continue to record disposition as we work";
"ledger is disposed of even before bootstrap exit. Disposing of the ledger is
the critical path to `/align` skill materialized from greenfield disposition
graph."

**Content.** The skill is operational text projected from node, under,
authority, growth, persistence, and readings, and lives on this ref under
`.claude/skills/align`. Until it exists, rounds run by hand in the bootstrap
session following `CLAUDE.md` on this ref.

## L16 exit criteria

**Content.** In `disposition-graph/bootstrap`, as its instrument: every rule
this project runs under is a node or a declared shim; dispatch selects from
this graph's frontier; `/align` is the only path by which a node is recorded;
nothing live reads the legacy `intentions/` tree; this ledger is empty and
deleted.

## L17 legacy nodes are evidence, never imported

**Content.** In `disposition-graph/legacy`. The AI in the bootstrap session
was measurably over-bound by the legacy record (author, 2026-09-02: "this
session is over-bound by legacy disposition"; "Why are you referring to
tactics, that is deprecated even by the legacy greenfield"). Context focus for
later sessions comes from L04 and L05.

## L18 README, description, and tags are projections

**Source.** Author, 2026-09-02: "Before bootstrap exit the doctrine must be
recorded that github repo description and tags (for search and discovery)
must be materialized from repo disposition as well as the README.md which will
either embed graph explorer artifact navigated to the core repo scope/purpose
node, or reference it as the primary source of repo documentation."

**Content.** Stated in `disposition-graph/projection`; the materialization is
a bite on `main` (README, repository description, topics) once the purpose and
audience nodes are ratified. GitHub READMEs cannot embed a live page, so the
README either renders the purpose node's page statically or links the browser
at the purpose node; the browser supports deep links by node id for that.

## L19 the revision-2 model page is input, not doctrine

**Stub.** `bootstrap/model-proposal.html` on this ref is the onboarding page
published 2026-09-02 as the private artifact "The Disposition Graph"
(https://claude.ai/code/artifact/c499a263-08bd-46b4-84b5-05009d5bafd0). It
carries the revision-2 model, the author's six rulings, and legacy-facing
appendices. Superseded node by node as the browser grows; deleted with this
ledger.

## L21 definitions of "appropriate" for delegation

**Source.** Author, 2026-09-02: "Be sure to break the browser implementation
into 'appropriate' units and delegate to 'appropriate' model with
'appropriate' effort level. Before bootstrap exit these definitions of
'appropriate' will need to be recorded as ratified doctrine."

**Content.** Round zero's working definitions, in `CLAUDE.md` on this ref:
a unit is one deliverable with a written contract and a test; sonnet for
mechanical tooling, tests, surveys, and format work; opus for design-heavy
or judgment-heavy units; haiku for lookups; the main thread never writes
tooling. To be recorded as a node under `growth` and ratified.

## L22 vocabulary and traditions on the onboarding path

**Source.** Author, 2026-09-02: "Before bootstrap exit technical repo
vocabulary like 'disposition', 'ratified', 'doctine' will need to be recorded
on the onboarding path of the graph and clearly identified with appropriate
layout in the documentation projection. References to tradition also need to
be clearly called out with appropriate layout."

**Content.** Stubbed: the `defines` frontmatter field names the terms a node
defines; the browser links every occurrence of a defined term to its defining
node, offers a vocabulary view, and renders readings as a distinct block with
source locus and relation. First published 2026-09-02 as the private page
https://claude.ai/code/artifact/502111c1-a7fb-4108-a9cb-ebb7b2a44933 (28
nodes); republished to the same address each round. "disposition" is defined by `model`; "ratified",
"doctrine" by `authority`; "archē" by `public/agency`.

## L23 token-efficiency rule for bootstrap sessions

**Source.** Author, 2026-09-02: "Recommend basic token efficiency rule to be
recorded in bootstrap operations to ensure any simple
reconciliation/materialization/implementation tasks performed during bootstrap
and handled by a subagent with appropriate model and effort level. Main thread
is a very expensive fable model at max effort level - not appropriate for most
implementation tasks. You own the graph/ledger - subagents work from that."
And: "Recommend if bootstrap operation rules are better recorded using session
memory - if so move the rules there and drop the operations doc."

**Content.** Recorded in `CLAUDE.md` on this ref, which every session and
subagent rooted in this worktree loads. Session memory was evaluated and
declined for the rules themselves: it is private to one account and one
project path, unversioned, and invisible to subagents; it holds only a pointer
here. Liquidates into `disposition-graph/bootstrap` and the skill.

## L24 scope node and coverage review

**Source.** Author (L12): "If there are other recorded functions in the
incumbent code/graph then present for review to ensure full coverage of
scope."

**Content.** A survey of the repository's recorded functions is written to
`bootstrap/scope-survey.md`; `disposition-graph/scope` is drafted from it as
an open question with the clusters as its proposal, for the author to rule on
in round one.

## L25 the disposition ref stores the graphs and only the graphs

**Source.** Author, 2026-09-02: "the disposition ref stores the graph(s) and
only the graph(s)".

**Content.** In `disposition-graph/materialization` and `persistence`. The
`disposition` ref's tree is the manifest `disposition.yaml` and the graph
directories, nothing else. Alignment of the bootstrapped implementation:
`tools/`, `browser/`, `bootstrap/`, `LEDGER.md`, and `CLAUDE.md` move off the
disposition ref to the `greenfield` ref (L28), the tooling under
`packages/disposition/` (L27); paths cited by nodes are updated.

## L26 graph tooling is justified by disposition like all materialized implementation

**Source.** Author, 2026-09-02: "graph tooling is justified by disposition
just like all other materialized implementation".

**Content.** In `disposition-graph/materialization`. Each tool is the
instrument of the schema node whose answer it checks or projects (L14); a
tool no disposition cites or instruments is unsupported implementation on the
frontier (L11). The reader, validator, ratify command, and projector are
instruments of `node`, `authority`, and `projection`.

## L27 materialized implementation is organized as a `packages/` monorepo

**Source.** Author, 2026-09-02: "all materialized implementation is organized
using javascript monorepo convention of a packages/ directory (make reference
to this tradition)".

**Content.** In `disposition-graph/materialization`. The tradition: Lerna
(2015, out of Babel), Yarn workspaces (2017), npm workspaces (npm 7, 2020),
pnpm workspaces; one repository, a root manifest declaring `workspaces:
["packages/*"]`, one directory per package; the older single-repository
practice in Potvin and Levenberg, "Why Google Stores Billions of Lines of
Code in a Single Repository" (2016). A reading is owed. The incumbent
`packages/intentionsutil` on `main` is evidence of the convention, not
authority. The greenfield tooling lives at `packages/disposition/`.

## L28 shim: greenfield implementation on a third ref, swapped with `main` at exit

**Source.** Author, 2026-09-02: "as a shim to avoid conflicts with incumbent
code, materialized implementation for the greenfield disposition graph being
bootstrapped may be kept in a third ref which will be swapped with main on
bootstrap exit."

**Content.** The ref is named `greenfield` (a delegated choice; rename
freely). Orphan, created 2026-09-02, worktree `.claude/worktrees/greenfield`.
It holds `CLAUDE.md`, `LEDGER.md`, `bootstrap/`, and `packages/`. The
disposition worktree is nested inside it at `greenfield/disposition/`,
gitignored, so one session can write both trees; tooling takes the graph
directory as an argument and will later read the ref directly. Liquidation:
at bootstrap exit `greenfield` is swapped with `main`. Consequence to keep in
view: whatever on `main` is to survive the swap (the applications, host
configuration, and anything else with a supporting disposition) must be
reconciled into `greenfield` before exit, or the swap prunes it. That
reconciliation is the second direction of L11 applied to the whole of `main`.

## L29 shimmed code review for every bootstrap landing; review doctrine before exit

**Source.** Author, 2026-09-02: "All bootstrap implementation will require
shimmed code review. This is not trivial and a common source of lost
time/tokens. The abandoned bootstrapping attempt has some rules for code
review in bootstrap operations. Coordinate with that session named
'interview deferral options (2)' to adopt those rules. Before bootstrap exit
we will need good doctrine for code review as part of reconciliation."

**Content.** Stubbed in `disposition-graph/review` under `work-loop`. The
rules adopted from the legacy record (the review shim ratified 2026-09-01 on
the legacy node `strategy-graph-native-dispatch`, and steering ledger entries
[1], [6], [7] on the legacy bootstrap carrier), restated in this graph's
vocabulary:
- every landing of materialized implementation is reviewed by the review
  instrument before it lands; the review is scoped to the landing's diff and
  judges the match between the unit's contract and its evidence;
- effort high by default; one medium regeneration for diffs that touch only
  documents, plans, or tests;
- settle on the severity gate: a finding blocks only if it violates the
  unit's contract or regresses a check that ever passed; every other finding
  never blocks and never enters the fix loop, and is recorded as a proposal
  on the node the unit instruments (during bootstrap, on this ledger);
- fix all findings, then regenerate once per batch, never per fix; at most
  two regenerations per landing; an open blocking finding at the cap parks
  the landing for the author and nothing lands over it;
- functional findings reconcile before non-functional; both before landing;
  no scope expansion inside a review window;
- the diagnose-fix-verify loop for findings is a subagent unit (L23); the
  main thread reads the verdict and lands.
Shim: the incumbent detached instrument on `main`,
`.claude/skills/dispatch-propagate/scripts/dispatch-code-review`, run from
the `greenfield` worktree against a commit range on that ref; its
detachment, locks, and await loop are instrument facts, not doctrine.
Liquidation: assessments produced by an instrument on the `greenfield` ref
from this graph's ratified `review` node. Applies retroactively to round
zero: the tooling and the browser are reviewed under the shim before they
land on `greenfield`. Coordination with the legacy session "interview
deferral options (2)" requested 2026-09-02; its reply amends this entry.
Traditions the legacy record cites, owed as readings: Deming, Out of the
Crisis (1986), point 3, diverged from in keeping adversarial review;
content-addressed incremental builds (Bazel, Nix) for pinning what a review
read.

## L20 delete this ledger

When every other entry is `ratified` or `rejected`, delete this file. Its
history stays in git.
