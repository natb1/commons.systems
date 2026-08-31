---
id: tactic-keystone-decomposition-reorg
kind: tactic
statement: Re-organize the keystone cluster under the decomposition corollary —
  test each keystone node for motivation-coherence (materially different
  motivation profiles decompose; matching profiles may merge) now that
  sustenance has a first-class home
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-30 /align sustenance round (landed
  b51df73f), recorded at the author's direction. That round minted
  virtue-right-livelihood (ratified) and virtue-knowledge-as-gift
  (delegated-pending-review) and re-homed strategy-financial-sustainability's
  serves onto the livelihood root — which means the keystone cluster's
  motivation profiles changed shape after most of its nodes were composed.
  strategy-graph-mounts' decomposition corollary (author-ratified) keys node
  granularity on motivation-coherence: decompose a node when its decisions would
  carry materially different motivation profiles (a different serves set or
  different graft constraints); compose or merge only when profiles match.
  Nothing has yet applied that test to the cluster the corollary now governs.
  Two-entry serves per the artifact-owner rule: the corollary is
  strategy-graph-mounts doctrine, but the keystone record it re-organizes is
  strategy-explicit-intent's substance."
reading: null
serves:
  - strategy-graph-mounts
  - strategy-explicit-intent
recovers: []
clarifications:
  - question: What stale vocabulary does the draft body carry (drift review, 2026-08-30)?
    answer: "(Recorded 2026-08-30 /align-tactics tactic-mode drift review —
      body-vocabulary correction.) The draft body's two references to
      virtue-knowledge-as-gift as \"delegated-pending-review\" (in the rationale
      and in the Constraints paragraph) are pre-resolution-round vocabulary.
      Measured at HEAD 2026-08-30, `grep -n '^status:'
      intentions/virtue-knowledge-as-gift.md` returns `status: deferred` — the
      2026-08-30 resolution round migrated delegated-pending-review to deferred
      (strategy-explicit-intent.md clarification 24, line 747). The constraint's
      substance is unaffected: the node is unratified, and this tactic must not
      ratify, restate, or pre-empt its content. Sibling
      tactic-substantiation-edge-migration (status raw, phase null) already
      names this node at
      intentions/tactic-substantiation-edge-migration.md:25,43 as within its
      legacy-vocabulary sweep, so the finalize should spell the status
      `deferred` rather than leave a second file for that sweep."
  - question: Are the [SECONDARY-SERVES] pointer's clarification indices 18/21/24
      correct (drift review, 2026-08-30)?
    answer: "(Recorded 2026-08-30 /align-tactics tactic-mode drift review — pointer
      verification, refuting a suspected drift.) A gather-phase pass suspected
      the [SECONDARY-SERVES] pointer's citation of strategy-explicit-intent
      clarifications \"18, 21, 24\" was off by one (counted as 19/22/25).
      Re-measured at HEAD by counting `  - question:` entries inside the
      clarifications block only: entry 18 is at line 539 (the three-state
      decision model), entry 21 at line 660 (the substantiation doctrine), entry
      24 at line 747 (the 2026-08-30 resolution-round ledger). The cited indices
      are CORRECT; the suspected off-by-one came from counting question markers
      outside the clarifications array. A planner following those pointers
      should use 18/21/24 as written and not renumber them."
  - question: What existing tooling serves the corollary's serves-set half (drift
      review, 2026-08-30)?
    answer: (Recorded 2026-08-30 /align-tactics tactic-mode drift review — reuse
      roster for whoever plans this node.) The corollary's serves-set half is
      machine-readable today and should not be hand-derived.
      packages/intentionsutil/scripts/node-ancestry.ts:47-53 renders a node's
      serves chain and ancestor virtue roots (AncestorEntry at :99-111) — the
      two things the corollary tests;
      .claude/skills/align-tactics/SKILL.md:96-99 already runs it on the claimed
      node at worktree entry.
      packages/intentionsutil/scripts/align-strategy-census.ts:63-75
      (printUnservedVirtues) checks set-difference over every strategy's serves
      versus the virtue set, catching a virtue left unserved by a decompose or
      merge. packages/intentionsutil/src/digest.ts:202-217 (tableDupServes)
      mechanically detects a node re-declaring a parent-inherited serves entry —
      the merge-candidate half; :251-273 (tableNearDup) shortlists similar
      statements, and its own comment at :247-248 is explicit that this is "a
      shortlist for the audit's human disposition, never a disposition itself",
      matching this node's own "record the pass as an explicit
      motivation-coherence finding rather than silence".
      packages/intentionsutil/src/digest.ts:144-184 (tableClosure) verifies
      every affected node still reaches a kind:virtue root after any
      disposition. Per .claude/rules/sandbox.md, spell these `node --import
      tsx/esm <script>`, not `npx tsx`.
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Three unrecorded premises the plan depends on need author ratification
    before a clean-session plan can be authored for this node. (1) SCOPE
    UNDEFINED — the tactic's statement scopes work to \"the keystone cluster\",
    but measured at HEAD 2026-08-30 `keystone` appears in five intentions files
    and outside this node always denotes a graph-POSITION ranking property
    (strategy-explicit-intent.md:753,772;
    strategy-graph-review-curriculum.md:447,461;
    tactic-node-review-skill.md:129,195), never an enumerated set; the draft's
    candidates 3 and 4 are unbounded sweeps (\"any keystone-adjacent node whose
    serves predates the livelihood root\", \"if any two cluster nodes\") that no
    plan can anchor. Ratify a roster, a mechanical membership rule, or a
    narrowing to the two named candidates. (2) DELIVERABLE AMBIGUOUS — the
    node's own Constraints paragraph routes any serves/edge change on a ratified
    node through /align, \"not through this tactic's implementer acting alone\",
    yet all four candidate examinations terminate in exactly such a change; that
    leaves the tactic's autonomous scope as findings-only (dated
    motivation-coherence clarifications, per the precedent at
    intentions/tactic-graph-refsplit-read-coherence.md:71-78, since a
    tactic-target session may not write a serving strategy —
    .claude/skills/align-tactics/references/tactic-target.md:146-157). Ratify
    findings-only versus restructuring; the two produce wholly different plans.
    (3) HALF THE TEST HAS NO STRUCTURE — the corollary tests \"a different
    serves set or different graft constraints\", and the graft half has zero
    footprint at HEAD (grep -c graft packages/intentionsutil/src/schema.ts = 0;
    no kind-mount node; tactic-mount-schema's PR 2856 open and unlanded with the
    mount tree blocked on it), while candidate 1 — the flagship examination —
    turns explicitly on graft constraints. Ratify the sequencing: run now on the
    serves half with provisional dispositions, add blocked_by:
    [tactic-mount-schema], or split into a serves-half pass now and a graft-half
    follow-up. Side A: no recorded condition on strategy-graph-mounts failed —
    all five were checked against HEAD and none is contradicted; note only that
    every condition and clarification describes a design ratified in prose with
    no structural footprint yet, which is the state premise (3) turns on, not a
    failed condition. Recommend (Claude, from the ratified record): ratify the
    findings-only reading — the node's own Constraints paragraph and the
    tactic-graph-refsplit-read-coherence precedent both point there, and a
    tactic-target session may not write a serving strategy anyway; fix the
    roster to the four named nodes (virtue-right-livelihood,
    virtue-knowledge-as-gift, strategy-financial-sustainability,
    strategy-open-source-as-gift) with the two open-ended sweeps split out as a
    later tactic; and run now on the serves half with each finding carrying an
    explicit provisional-pending-mount-structure caveat rather than adding
    blocked_by: [tactic-mount-schema]. Then re-run /align-tactics
    tactic-keystone-decomposition-reorg."
  since: 2026-08-30
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Re-organize the keystone cluster under the decomposition corollary — test each keystone node for motivation-coherence (materially different motivation profiles decompose; matching profiles may merge) now that sustenance has a first-class home

# Keystone re-organization under the decomposition corollary

Draft (retain-not-refine): scope and known candidates recorded here; a later
/align-tactics round plans it. The test to apply is strategy-graph-mounts'
DECOMPOSITION COROLLARY (author-ratified): node-level influence granularity is
accurate only while nodes are motivation-coherent — decompose a node when its
decisions would carry materially different motivation profiles (a different
serves set or different graft constraints); compose or merge only when
profiles match. It is the structural dual of /align's multi-topic separation
rule (that one keys on independent success signals; this keys on motivation).

## Why now

The 2026-08-30 sustenance round (landed b51df73f) changed the cluster's
motivation topology after most of its nodes were composed: sustenance gained a
first-class home (virtue-right-livelihood, ratified), its tension sibling
virtue-knowledge-as-gift entered delegated-pending-review, and
strategy-financial-sustainability's serves was re-homed to include the
livelihood root. Every keystone node composed before that round was shaped
without the corollary's test being runnable — sustenance motivation had
nowhere to point, so it hid inside instrumental framings.

## Candidate examinations (each is a corollary test, not a foregone split)

1. **strategy-financial-sustainability's mixed serves** — now
   [alignment-of-attachments, respect-for-persons, virtue-right-livelihood],
   recorded in that node's 2026-08-30 clarification as genuinely mixed and
   coherent. Test whether its decision classes actually share that profile:
   livelihood-driven monetization decisions (pricing, what to charge for)
   versus alignment-driven attachment management (keeping funding reversible,
   platform-graft containment) may carry materially different graft
   constraints. If they do, the corollary says decompose; if the profiles
   genuinely travel together, record the pass as an explicit
   motivation-coherence finding rather than silence.
2. **The gift clause's home when the pending review resolves** — the
   knowledge-should-be-free clause currently shadows
   strategy-financial-sustainability (its clarification names the pending
   root's shadow). When an /exetasis sitting or adjacent /align round
   resolves virtue-knowledge-as-gift, its tension_with edge starts binding
   real monetization decisions; test whether the constraint belongs as graft
   edges on the deciding strategies rather than prose in the funding node.
3. **Pre-livelihood serves sweep** — any keystone-adjacent node whose serves
   predates the livelihood root and whose rationale smuggles sustenance
   motivation inside an instrumental framing ("fund the project" phrasing is
   the marker) now has a first-class virtue to cite; re-point or decompose
   per the corollary.
4. **Merge direction** — the corollary cuts both ways: if any two cluster
   nodes turn out to carry the same motivation profile (same serves set, same
   graft constraints), they are merge candidates, and keeping them separate
   needs a reason the corollary can see.

## Constraints

- virtue-knowledge-as-gift is delegated-pending-review: this tactic must not
  ratify, restate, or pre-empt its content — structural re-homing that
  depends on its resolution waits for the sitting (candidate 2 records the
  dependency; it does not discharge it).
- Any serves/edge change to a ratified node is doctrine motion: it goes
  through /align (adjacent-doctrine path), not through this tactic's
  implementer acting alone.
- The three-state decision model and stamp grammar are recorded on
  strategy-explicit-intent (2026-08-30 clarifications); read them at
  origin/main before touching any stamped content.

## Parked 2026-08-30 — three author rulings needed before a plan exists

Parked by the /align-tactics per-node drift review (office_hours carries the
full reason). The three questions, in brief:

1. **Scope** — "the keystone cluster" has no defined membership: everywhere
   else in the graph `keystone` is a graph-position ranking property, never an
   enumerated set, and candidates 3–4 above are unbounded sweeps no plan can
   anchor. Ratify a roster, a mechanical membership rule, or a narrowing to
   the named candidates.
2. **Deliverable** — the Constraints section routes every serves/edge change
   on a ratified node through /align, yet all four candidate examinations
   terminate in exactly such a change. Ratify findings-only (dated
   motivation-coherence clarifications, per the
   tactic-graph-refsplit-read-coherence precedent) versus actual
   restructuring; the two produce wholly different plans.
3. **Sequencing** — the corollary's graft-constraint half has no structural
   form yet (no `graft` in schema.ts, no kind-mount node, tactic-mount-schema
   PR 2856 open), and candidate 1 turns explicitly on graft constraints.
   Ratify: run now on the serves half with provisional dispositions, block on
   tactic-mount-schema, or split serves-half/graft-half passes.

Claude's recommendation is appended to the office_hours reason: findings-only,
roster fixed to the four named nodes with the sweeps split out, run now on the
serves half with a provisional-pending-mount-structure caveat on each finding.
