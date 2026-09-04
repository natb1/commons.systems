---
question: How does a ruling made on the page reach the record?
form: rule
stage: maieutic
facts:
  - name: answer
    options:
      - name: stateful-artifact-record
        source: ai
        ref: "2026-09-04"
      - name: stateless-instruction-only
        source: ai
        ref: "2026-09-04"
      - name: instruction-canonical-buffer-optional
        source: ai
        ref: "2026-09-04"
      - name: database-as-the-record-with-a-fallback
        source: ai
        ref: "717485e6"
        status: passed
        reason: "it inverts which one the graph depends on, and a fallback never exercised does not work"
      - name: prompt-url-for-a-whole-sitting
        source: ai
        ref: "717485e6"
        status: passed
        reason: "it answers a length problem by hosting the prompt somewhere, which is the second store under another name"
      - name: two-copy-controls-one-per-route
        source: ai
        ref: "717485e6"
        status: passed
        reason: "the routes differ in where the text goes and never in what it says"
    recommends: instruction-canonical-buffer-optional
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
shims:
  - artifact: "the session launch control on the alignment page and on every stage chip, `https://claude.ai/code?prompt=<the instruction>&repositories=natb1/commons.systems`, stubbed in the user interface and in the implementation: it is rendered and it is marked a stub, and no part of the flow depends on it"
    for: the launch half of this node's answer, the copy half being the route the author uses
    liquidation: a session opened from the link is confirmed to reach the graph, and the stub mark comes off; or the link is found not to and it is deleted, the copy standing alone
    declared: 2026-09-04
under:
  - commons.systems/disposition-graph/alignment-page
---
## Disposition

The author, 2026-09-04, on reading that "Submit" writes to the artifact's own
database rather than starting a session:

> Compare a stateful artifact approach to a stateless session flow (either via claude.ai/code session seed or copied instruction)

The author, 2026-09-04, on reading the comparison:

> claude.ai/code session initialization can be kept as a stub out shim (in ui and implementation). Author will rely on incstruction copy for now. You have bootstrap authority to reconcile.

## Facts

### answer

#### stateful-artifact-record

What the page does today. A ruling is staged in the browser and submitted into
the artifact's database as one document per node in the collection
`responses`, and the alignment skill reads that collection back with the
Artifact tool at the head of every sitting. The database is where a ruling
lives between the author making it and a session landing it in the graph.

It buys three things that are real. It survives the device: the author can
rule from a phone and a session can land it from a laptop with no clipboard
crossing between them. It is exact: a session reads structured documents and
nothing is transcribed, parsed out of prose, or truncated. And it has no size:
a sitting of seventy rulings costs no more than one.

It costs four. It is a second store of authored content outside git, and
`materialization` says all materialized implementation is a projection of the
graph -- a database holding the author's own rulings is not a projection but a
source, which makes the artifact a second write surface for a record the
alignment skill says only that skill writes. Nothing pins it: a response
document names a node and a stage, never the text it was ruling on, so when
the graph moves between the ruling and the recording -- and it moved six times
on 2026-09-04 alone -- the response can refer to a state that no longer exists
and nothing detects it, which is exactly what `amends`, `at` and `of` exist to
catch everywhere else in the record. It depends on a capability and a tool: a
session without the Artifact tool cannot read it, and whether a cloud session
seeded from a `claude.ai/code` link has that tool is precisely the case this
refinement is about. And nothing deletes it: a landed response stays in the
collection and the record carries no rule for when it goes.

#### stateless-instruction-only

The page holds no server state at all. A ruling leaves as an instruction: a
seed link, `https://claude.ai/code?prompt=...&repositories=...`, which
pre-fills a session, or the same text on the clipboard for a session already
open. The graph is the only store, the page is a projection of it, and the
transport holds nothing.

It buys the four the incumbent costs, and one more: it is what the shim on
`alignment-page` already names as its own liquidation, "the alignment skill
reads the responses without the artifact tool". The record has therefore
already said this is the direction, and the incumbent is the declared stand-in.

It costs three. The tab is the state, so closing it before copying loses the
work -- much reduced by the local staging the page already keeps, which is a
per-viewer draft buffer and not a record, but not eliminated. The device that
rules must be the device that pastes. And a seed link has a length limit that
a sitting does not fit; `prompt_url` answers that by hosting the prompt
somewhere, which is another store under another name.

#### instruction-canonical-buffer-optional

The instruction is the transport and the database is an optional buffer.

The page always produces the instruction, and the copy control and the seed
link emit the same text, so the two routes cannot drift apart. The database
keeps one job and loses the rest: letting a session skip the paste when the
author ruled somewhere else. It is a convenience and never the record, a
session that cannot reach it loses a paste and nothing more, and no ruling
exists only there.

What this buys over either pure alternative is that the liquidation becomes
free. Pure stateful entrenches the database in the flow, so removing it on the
shim's own condition means redesigning the flow. Pure stateless gives up the
device independence now, before the seeded-cloud-session question has actually
been settled, and would have to rebuild the flow if that answer comes back
badly. Making the instruction canonical settles the design without settling
the open question, and the open question then decides only whether the buffer
is worth keeping.

#### database-as-the-record-with-a-fallback

The artifact's database is the record of a ruling, with the copied instruction
as a fallback. It was passed over because it inverts which one the graph
depends on, and a fallback that is never exercised is a fallback that does not
work.

#### prompt-url-for-a-whole-sitting

A `prompt_url` carries a whole sitting past the length limit of a URL. It was
passed over because it answers a length problem by hosting the prompt
somewhere, which is the second store again under another name.

#### two-copy-controls-one-per-route

The page offers two copy controls, one per route. It was passed over because
the routes differ in where the text goes and never in what it says, so two
controls emitting one string is one control.

### authority

Delegated: this is how one projection carries a ruling to the record, under an
answer about the page that is itself unanswered, and it commits the author to
nothing they cannot reverse by ruling the page's own question differently.
Escalate it to ratified if the answer turns out to move where the record lives,
which none of the three alternatives does.

## Recommendation

```markdown
---
question: How does a ruling made on the page reach the record?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

By an instruction, always; by the artifact's database as well, while that is worth its keep.

The page produces one instruction for a ruling and one for a sitting, and every route to a session carries that same text: the seed link that pre-fills a session, the clipboard for a session already open, and the per-node chip that opens the dialogue on one node. Two controls that claim to do the same thing and emit different text is the defect this answer exists to prevent, so they are generated from one function and never written twice.

The launch half is a stub and is marked as one, on the author's ruling of 2026-09-04 that they will rely on the copy. It is rendered, it is a real link with a real instruction in it, and nothing depends on it: a mark on the control says so and its shim carries the two ways it can end, confirmed and unmarked, or found not to work and deleted with the copy standing alone. A stub that looks finished is worse than no stub, because the author cannot tell which of the two routes they are being offered.

The artifact's database keeps one job: letting a session skip the paste when the author ruled on another device. It is a buffer and never the record. No ruling exists only there, a session that cannot reach it loses a paste and nothing else, and the alignment skill treats a response it finds there as a convenience, reading it exactly as it would read the same instruction pasted by hand.

The record is the graph and there is no second place a ruling lives. That is the whole of the rule, and everything above is how it is kept while a page stands between the author and the graph.

## Rationale

The author asked for the comparison on 2026-09-04, after finding that "Submit" writes to the artifact's database rather than starting a session, which is what the button's own name had not told them.

The stateful incumbent buys device independence, an exact structured round trip, and no size limit. It costs a second store of authored content outside git, which `materialization` does not allow a projection to be; an unpinned one, where every other reference in the record carries `amends`, `at` or `of` precisely so that text moving underneath a reading is caught; a dependence on a tool that the seeded cloud session at issue here may not have; and no rule for when a landed response is deleted.

The stateless flow costs the tab, the device, and the length of a URL, and buys the four back, along with agreement with the shim on `alignment-page`, whose liquidation condition already reads "the alignment skill reads the responses without the artifact tool". The record has already called the database a stand-in.

Neither pure form is taken, because the question that separates them is open and cheap to settle: whether a session seeded from a `claude.ai/code` link can read the artifact's database at all. Making the instruction canonical settles the design without waiting on that, and leaves the buffer as the only thing the answer decides. If the buffer never earns its keep it is deleted and nothing is redesigned, which is what the shim's liquidation asks for and what neither pure alternative gives.
```

## Account

### Minted from the author's question, 2026-09-04

Minted as a node rather than as alternatives on `alignment-page` because the
author would rule on it separately from the screen: under `aspects-are-nodes`
that makes it a question, and a question is a node under the one it refines.
`alignment-page` answers what the author reads to rule; this answers how what
they decide there reaches the graph.

The comparison was asked for and is given in the three alternatives above
rather than in the answer, so that the two the recommendation does not take
are on the record with what each buys and costs, and the author can rule for
either without the analysis having to be reconstructed.

One question is left open on purpose and named in the rationale: whether a
cloud session seeded from a `claude.ai/code` link can read the artifact's
database. It decides whether the buffer is worth keeping and nothing else. It
was not settled here because settling it means running one, and the answer
does not wait on it.

The deep-link format is verified, not assumed: `claude.ai/code` supports
`prompt` (alias `q`) and `repositories` (alias `repo`) as query parameters,
documented at code.claude.com/docs/en/web-quickstart. The link pre-fills the
form and does not submit it, and Claude Code on the web is a research preview
requiring a signed-in account, both of which the page should not pretend
otherwise about.
