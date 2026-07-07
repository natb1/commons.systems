---
id: tactic-readme-data-structure-first
kind: tactic
statement: Rewrite README.md around the data-structure-first framing — new
  headline, intention graph leading, harness as one consumer
owner: ai
status: codified
parent: null
rationale: "The immediate deliverable of the 2026-07-07 /align-strategy
  interview that recorded strategy-data-structure-first: the current README
  headline ('a long-horizon agent orchestrator') is harness-first and must
  invert. Retained as a draft for /align-tactics; the interview's copy
  constraints are carried in the node body."
reading: null
gap: null
serves:
  - strategy-data-structure-first
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates:
  - strategy-data-structure-first
blocked_by:
  - tactic-readme-copy-approval
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Rewrite README.md around the data-structure-first framing — new headline, intention graph leading, harness as one consumer

## Context

The current `README.md` headline is harness-first — `# commons.systems: a
long-horizon agent orchestrator`, with an opening paragraph that leads with
"A harness for long-horizon autonomous agent workflows, built around one data
structure: the **intention graph**." This sells the consumer (the harness) and
buries the product (the intention graph). strategy-data-structure-first
inverts the project's public identity: the intention graph is a data structure
for managing intentions and alignment that a reader can adopt with their own
project management and agentic workflows; the long-horizon coding harness is
one consumer of it — the reference consumer. This tactic rewrites the top of
the README so it leads with the data structure and presents the harness as one
consumer. It is the strategy's signal-validating surface: the success signal
is owner review at office-hours confirming the README leads with the framing.

This tactic touches **README.md only**. Landing and brand surfaces align in
later tactics as they are next touched (README/landing audience split holds:
README is the tier-3 practitioner surface, landing is tier-2).

**Approval gate (hard dependency).** This tactic is `blocked_by`
tactic-readme-copy-approval — a born-parked office-hours human gate. The router
cannot select this rewrite until the author ratifies or revises the draft
headline, subline, and identity sentence recorded below. When the author
approves, the outcome (approved wording, or the revision and why) is recorded
as a dated clarification on strategy-data-structure-first. The implementing
session settles remaining wording **only within the author-approved copy** —
the draft copy below is the author's requirement text, binding in substance,
refinable in wording, but the approved version (from the clarification the
copy-approval gate records) supersedes it wherever they differ. Before
implementing, read strategy-data-structure-first's clarifications for the
approval outcome and use that wording.

## Unit 1 — Rewrite the README top-of-file framing

**Recommended model:** opus. This is the project's public identity copy, with
subtle framing constraints (positioning inversion, "alignment" carrying two
readings without leaning on jargon, honest-direction claims). It needs voice
and positioning judgment, not mechanical edits.

**Scope — what changes (README.md only):**

- **Headline** `README.md:1` — replace `# commons.systems: a long-horizon
  agent orchestrator` with the data-structure-first headline. Author draft:
  "commons.systems: A data structure for managing intentions and alignment"
  (use the author-approved wording from the copy-approval clarification).
- **Opening paragraph** `README.md:3-11` — currently "A harness for
  long-horizon autonomous agent workflows, built around one data structure:
  the **intention graph**. …". Rewrite to lead with the intention graph as the
  adoptable data structure and present the harness as one consumer — the
  reference consumer. Fold in the two-uses framing (author draft subline): the
  reader's own project management and agentic workflows first, the provided
  long-horizon agentic coding harness second, in that order.
- **Identity sentence** `README.md:13-15` — currently "Owned and self-managed,
  local-first, built to be forked: not a platform, not a library, but a
  reference setup an individual runs on their own GitHub, Firebase, and
  Anthropic accounts." Replace the "not a platform, not a library, but a
  reference setup" identity with the spec + reference-implementation shape: the
  schema, node kinds, and attention/signal semantics are the adoptable thing;
  this repo is their reference implementation, harness included. "Not a
  platform" survives; "not a library" **softens** (packages/intentionsutil
  effectively becomes one). Keep the owned/self-managed/local-first/forkable
  character.

**Scope — constraints:**

- **'alignment' carries both readings deliberately** — agent-alignment (agents
  act on your recorded intent) and the graph's own sense (alignment of
  attachments and intentions with virtues) — without leaning on either as
  jargon. Do not gloss or define the word; let it read as practical vocabulary.
- **Standalone use is a direction, stated honestly.** No copy claims standalone
  capability beyond what exists. Tooling assumes this repo's layout and skills
  assume the harness today; the separability gaps are tracked as work
  (tactic-graph-separability-audit). Phrase the reader's-own-workflows use as
  the intended shape/direction, never as a finished capability.
- **strategy-show-not-tell holds** — the README requires no philosophical
  buy-in; "intentions and alignment" reads as practical vocabulary, not
  doctrine.
- Writing style: simple, direct language; no corporate jargon (see
  `.claude/rules/writing-style.md`).

**Scope — out of scope:**

- Any file other than `README.md` (landing, brand, `packages/**`, skills).
- The **Status paragraph** `README.md:17-27` (projection-era router vs
  graph-native build-out) must **stay accurate** through the rewrite — do not
  let the reframed headline contradict it. Adjust only if the rewrite makes its
  wording inconsistent; otherwise leave it.
- The body sections below the identity/status block ("## The intention graph",
  "## The align skill family", "## The dispatch router", "## As a harness", the
  reference tables, "Related work") — leave in place. Light touch only where a
  sentence would now contradict the reframed headline (e.g. a stray
  harness-first characterization); do not restructure these sections in this
  tactic.

**Reuse:** the author's draft copy and interview constraints are captured
verbatim below (they were retained on this node from the /align-strategy
interview). The `## The intention graph` section already present in the README
(`README.md:29` onward) is the existing accurate description of the data
structure — the new opening should be consistent with it, not duplicate it.

## Verification

Prose (no automated check — this is copy whose acceptance is human judgment):

- The README first screen leads with the intention graph as the adoptable data
  structure; a first-time reader can state that the graph is adoptable with
  their own workflows and that the harness is one (optional) consumer.
- The identity sentence reads as spec + reference implementation; "not a
  platform" survives, "not a library" is softened.
- No sentence claims standalone capability beyond what exists (direction stated
  as direction).
- The Status paragraph remains accurate.
- Final acceptance is the strategy's sensor: owner review of the README at
  office-hours (this is what produces the strategy's reading). The implementing
  session does not self-certify the signal.

A build/link check may be run if desired but the README has no test surface:

```verify
git -C . diff --name-only origin/main -- README.md | grep -q README.md
```

---

## Author draft copy (input — superseded by the copy-approval clarification)

The author's requirement text, binding in substance, refinable in wording.
Use the author-approved version from strategy-data-structure-first's
copy-approval clarification wherever it differs.

> commons.systems: A data structure for managing intentions and alignment.
> Use it with your own project management and agentic workflows, or use it
> with the provided long horizon agentic coding harness.

The two sentences fix the framing: (1) the data structure is the product;
(2) the two uses are the reader's own workflows and the provided harness, in
that order.

## Copy constraints from the interview (recorded as clarifications on strategy-data-structure-first)

- **Inversion**: the current headline `README.md:1` ("a long-horizon agent
  orchestrator") is harness-first; the rewrite leads with the intention graph
  as the adoptable data structure and presents the harness as one consumer —
  the reference consumer.
- **'alignment' carries both readings deliberately** — agent-alignment and
  alignment-of-attachments — without leaning on either as jargon.
- **Standalone use is a direction, stated honestly**: no copy claims
  standalone capability beyond what exists (see
  tactic-graph-separability-audit).
- **Identity sentence**: replace "not a platform, not a library, but a
  reference setup" with the spec + reference-implementation shape — the
  schema/node kinds/attention+signal semantics are the adoptable thing; the
  repo is their reference implementation. "Not a platform" survives; "not a
  library" softens (packages/intentionsutil effectively becomes one).
- **Audience split holds**: README stays the tier-3 practitioner surface;
  landing stays tier-2. This tactic touches README only — landing/brand align
  in later tactics as they are next touched.
- **strategy-show-not-tell holds**: the README requires no philosophical
  buy-in; "intentions and alignment" reads as practical vocabulary.
- The existing Status paragraph (projection-era router vs graph-native
  build-out) must stay accurate through the rewrite.
