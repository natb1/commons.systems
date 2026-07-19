---
id: tactic-align-persistent-layer-doctrine
kind: tactic
statement: "encode into the align-strategy skill: standing graph structure
  (signal owners, boost carriers) lives on strategy or virtue nodes, never
  transient tactics"
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-13 /align-strategy round
  (author-dictated): while recording the main-health signal owner the author
  required the owner be a strategy — tactics are transient by definition — and
  required this constraint be encoded into the align-strategy skill so it stays
  visible whenever the persistent layer is modified. Doctrine home:
  strategy-graph-native-dispatch's 2026-07-13 persistent-layer clarification.
  Finalized by a 2026-07-18 /align-tactics per-node pass: two insertion points
  into .claude/skills/align-strategy/SKILL.md (a new dialectic step and a Step-5
  pre-write reaffirmation), with a rename hedge noted since
  tactic-align-entrypoint-consolidation (phase: implement) is queued to rename
  that skill to /align."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# encode into the align-strategy skill: standing graph structure (signal owners, boost carriers) lives on strategy or virtue nodes, never transient tactics

Finalized by a 2026-07-18 `/align-tactics tactic-align-persistent-layer-doctrine`
per-node pass. One PR, one unit.

## Context

On 2026-07-13, while recording the main-health signal, the author found a
tactic proposed as the owner of a standing `success_signal` — a category
error, since a signal owner or a standing `attention` boost/override carrier
must persist across rounds, while tactics are transient by definition (they
complete and leave the selectable graph). The fix at the time was ad hoc:
create `strategy-main-health` as the correct owner
(`intentions/strategy-graph-native-dispatch.md:1337-1341`). The author
dictated that this constraint be encoded into the `align-strategy` skill
itself so a future interview catches a tactic-as-standing-owner proposal
live, rather than needing a second interview to fix it after the fact
(`intentions/strategy-graph-native-dispatch.md:1402-1412`, the doctrine
home). This tactic adds that check as a durable step in
`align-strategy/SKILL.md`.

**Sequencing note (read before editing):** `tactic-align-entrypoint-consolidation`
(`phase: implement`, `blocked_by: [tactic-align-tactics-mechanical-floor]`) is
queued to rename `/align-strategy` to `/align` with a full-file move. If that
rename has already landed by the time this unit runs,
`.claude/skills/align-strategy/SKILL.md` will no longer exist at the path/line
numbers below — locate the renamed skill file (likely
`.claude/skills/align/SKILL.md`) and apply the same two insertions by matching
on the section headings and quoted text cited below (`### Dialectic steps`,
`Design-canvas support`, `## Step 5 — Record`, the `write-node.ts` sentence),
not the stale line numbers.

## Unit 1 — Add the persistent-layer ownership gate to align-strategy/SKILL.md

**Scope:**

File: `.claude/skills/align-strategy/SKILL.md` (or its post-rename path per
the sequencing note above). Two insertions, both prose, no code:

1. **New dialectic step 10.** After dialectic step 9, "Design-canvas support"
   (`.claude/skills/align-strategy/SKILL.md:320-329`, ending right before the
   blank line at `SKILL.md:330`), and before the `/file-issue` 8-category
   evaluation table that follows (`SKILL.md:331-343`), insert a new numbered
   item continuing the existing 1–9 list:

   > 10. **Persistent-layer ownership gate.** Whenever this interview is
   > about to record standing structure — a node that owns a `success_signal`
   > read on an ongoing basis, a node carrying a standing `attention`
   > boost/override, or any node other machinery permanently references — the
   > recorded owner must be `kind: strategy` (or `virtue`), never a tactic.
   > Tactics are transient by definition: they complete and leave the
   > selectable graph. If a tactic is proposed as a standing owner, surface it
   > as an interview question (recommend the owning strategy; propose creating
   > one if none exists — `strategy-main-health` is the worked precedent,
   > created 2026-07-13 for exactly this reason), never record-and-fix-later.
   > Resolution lands as a dated `clarifications` entry per the step-2.8
   > provenance convention.

   Do not renumber steps 1–9; this is appended as 10.

2. **Step 5 pre-write reaffirmation.** In `## Step 5 — Record`
   (`SKILL.md:408`), immediately before the "Write the full node through
   `write-node.ts` — never hand-edit the YAML frontmatter:" sentence
   (`SKILL.md:410-411`), insert one paragraph:

   > Before constructing the JSON to land, re-confirm no node this round is
   > about to record as a `success_signal` owner or a standing `attention`
   > boost/override carrier is `kind: tactic` — the same gate as dialectic
   > step 10, restated here as the final pre-write check so a resolution made
   > earlier in a long interview is not silently dropped by the time the JSON
   > is constructed.

**Out of scope:** no change to `schema.ts`, `validateGraph`
(`packages/intentionsutil/src/validateGraph.ts`), or any other skill file. No
new mechanical enforcement — this is a doctrine/checklist addition to a
Socratic-interview skill, not a validator rule; the constraint stays
author-visibility-only, matching how every other dialectic step resolves
(`AskUserQuestion`, never a park — `align-strategy` is interview-driven,
unlike `/align-tactics`).

**Recommended model:** sonnet — well-specified prose insertion at two named
anchor points with exact text given; no design judgment required.

**Dependencies:** none.

## Reuse

- Follow the existing dialectic-step provenance convention already used by
  steps 1–9, e.g. step 8's `{question, answer}` clarification shape
  (`SKILL.md:314-319`) and step 5's dated-clarification convention
  (`SKILL.md:284`) — do not invent a new resolution format.
- Cite `strategy-main-health` (`intentions/strategy-main-health.md`) as the
  worked precedent when the new step recommends "create the owning strategy
  if none exists," per the 2026-07-13 clarification at
  `intentions/strategy-graph-native-dispatch.md:1402-1412`.

## Verification

Prose only — this is a documentation/checklist change inside an interview
skill, not runtime code; there is no automated suite to run.

- Read the two inserted sections back in place and confirm: (a) the new
  dialectic step 10 sits between the existing step 9 and the 8-category table
  without renumbering steps 1–9; (b) the Step 5 addition sits immediately
  before the `write-node.ts` instruction and does not disturb the existing
  edit/new-strategy bullet list around it.
- Confirm both insertions cross-reference each other (the Step 5 addition
  says "same gate as dialectic step 10") so a reader hitting either one
  recognizes it is not a duplicate rule.
- Confirm the new text recommends surfacing the conflict as an
  `AskUserQuestion` interview question, never a park/office-hours action —
  `align-strategy` is interview-driven and `AskUserQuestion` is its expected
  mechanism, the opposite of `/align-tactics`'s autonomy contract.

No ```verify``` block: nothing here is machine-checkable — a grep-verifiable
prose insertion into a skill file is not a meaningful automated check under
this skill's own conventions.

## Provenance

Author-dictated 2026-07-13, while moving the main-health signal home from
the auto-created fix tactic to `strategy-main-health`: "as tactics are
transient by definition (this must be encoded into the align-strategy
skill so you don't forget this while modifying the persistent layer) a
strategy node that tracks the main health signal is required." Doctrine
home: `strategy-graph-native-dispatch`'s 2026-07-13 persistent-layer
clarification (`intentions/strategy-graph-native-dispatch.md:1402-1412`).
