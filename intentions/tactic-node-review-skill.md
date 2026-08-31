---
id: tactic-node-review-skill
kind: tactic
statement: Build the /exetasis skill (author-named; formerly drafted as
  /node-review) and the virtual review node — a derived, rank-ordered review
  target over durable-layer nodes un-reviewed since they last changed, with a
  per-node reviewed stamp
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-08-30 /align interview that added the
  indifference option to the interview round. The graph now records the doctrine
  (strategy-graph-review-curriculum's 2026-08-30 virtual-review-node
  clarification, and the amended conditions and success_signal); this tactic
  carries the encoding. Two-entry serves is the honest cross-cutting case (the
  artifact-owner rule, strategy-graph-native-dispatch clarification 27): the
  sitting skill is a curriculum artifact, but the derived rank-ordered candidate
  is router selection machinery, which strategy-graph-native-dispatch owns. The
  author flagged at the interview that this 'likely requires new mechanisms' —
  the router selects stored nodes today."
reading: null
serves:
  - strategy-graph-review-curriculum
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: How does this build reconcile with strategy-graph-review-curriculum's
      condition 4 (drift review, 2026-08-30)?
    answer: "(Recorded 2026-08-30 /align-tactics per-node finalize drift review.)
      Reconciling this build with strategy-graph-review-curriculum's condition 4
      ('expansion stays reversible and total — no node class becomes permanently
      exempt from review'): the eligible review-subject population this node
      builds is NOT the whole durable layer. Traditions and delegations are
      excluded outright — mount records carry no author dispositions
      (author-ratified, 2026-08-30 resolution round) — and virtues are reviewed
      only as ancestors, never ranked directly (author-ratified). The
      condition's 'total' clause predates both rulings and was not amended
      alongside them, so a reader checking the built sensor against the
      condition text will see an apparent breach. It is not one: the exclusion
      is scoped to /exetasis's author-disposition review, and mount accuracy —
      being objective rather than a disposition — is repaired by QA and
      office-hours processes rather than by a sitting. Recorded here rather than
      parked because the author already ratified the exclusion; nothing new
      needs ratifying and the plan reads the exclusion directly from the
      ratified clarification. A later strategy-touching round should fold this
      reconciliation into the condition text."
  - question: What is the measured code baseline for this build (drift review,
      2026-08-30)?
    answer: "(Measured 2026-08-30 during the /align-tactics per-node finalize drift
      review, in the strategy-explicit-intent worktree.) Baseline for scoping:
      this build starts from zero code. `.claude/skills/exetasis/` does not
      exist; grep over `packages/intentionsutil/src/` returns no occurrence of
      the decision-stamp vocabulary (`delegated-pending-review`,
      `delegated-review-declined`), of any reviewed-stamp or review-fingerprint
      field, or of `keystone` — the disposition model, the per-kind review
      fingerprint, the priority function and keystone rank inheritance are all
      prose-only. What DOES exist is the superseded predecessor:
      `packages/intentionsutil/src/coverage.ts` (run via
      `scripts/review-coverage.ts`) still implements the pre-2026-08-30
      mode-A/mode-B frontier-entry design and still counts tradition and
      delegation as durable review subjects. The two live durable-layer
      definitions also disagree — `coverage.ts:32-38` includes tradition and
      delegation, `grounding.ts:26-31` omits tradition — and NEITHER is the
      /exetasis subject set (see the condition-4 reconciliation clarification),
      so the plan must define that set explicitly rather than importing either
      constant. Also confirmed live this round:
      `.claude/skills/align/SKILL.md:326` and `:751` still cite the pruned
      `tactic-review-curriculum-coverage-sensor` (the fix this node's body
      already claims as in scope), `.claude/skills/align/SKILL.md` contains no
      'adjacen*' text at all (the ratified /align adjacency duty is unencoded),
      and `packages/intentionsutil/src/transitions.ts:525` still holds
      `isFingerprintStale`, the staleness predicate the body names as the one to
      mirror."
  - question: Which in-flight siblings own adjacent scope this build sequences
      around (drift review, 2026-08-30)?
    answer: "(Recorded 2026-08-30 /align-tactics per-node finalize drift review.)
      Three in-flight siblings this build sequences around rather than absorbs.
      (1) `tactic-substantiation-edge-migration` (status: raw) owns the
      state-vocabulary rename delegated-pending-review → deferred and
      delegated-review-declined → delegated; this node's plan targets the
      canonical ratified/deferred/delegated vocabulary and must not carry the
      sweep. (2) `tactic-attention-per-tier-boost-migration` Unit 3 rewrites
      `intentions/strategy-graph-review-curriculum.md`'s own frontmatter boost
      attribute inside a large data-only commit; a per-node finalize writes only
      this tactic node, so the collision risk here is low, but any later
      strategy-touching round must re-read after that migration lands rather
      than hand-editing the same block. (3) `tactic-align-audit-retirement`
      (phase: implement; `.claude/skills/align-audit/` confirmed still on disk
      this round) explicitly scopes coverage.ts's replacement to this node
      rather than to itself — so replacing the stale coverage sensor is this
      node's work, and the plan must not assume /align-audit is already gone."
  - question: Does the SUPERSEDING UPDATE retire the ~30-author-minute capacity
      condition (drift review, 2026-08-30)?
    answer: "(Recorded 2026-08-30 /align-tactics per-node finalize drift review.)
      Guard against a conflation this node's own SUPERSEDING UPDATE invites: the
      clause retiring 'the earlier
      session-type-penalty/30-minute/ancestor-prefix stamp' as superseded
      retires a priority-function implementation detail, NOT
      strategy-graph-review-curriculum's condition 1 (office-hours capacity
      bounds the cadence at ~30 author-minutes of independent author work per
      sitting, coverage amortized across cycles, never exhaustive). That
      condition still holds and still binds the sitting design; the
      author-ratified single-disposition-with-opportunistic-may-batch scope is
      the new mechanism that honors it. Related and still open by design: the
      retired stamp's unpenalized-rank clause (a derived review item is not a
      minted park, so no 0.5x re-pick penalty) is carried held-deferred to
      Claude (decision: deferred, delegation-anthropic-claude, 2026-08-30). The
      plan should state its disposition of that clause against
      `officeHours.ts`'s `SESSION_TYPE_PENALTY` / `sessionTypePenalty` rather
      than silently assuming either answer — it does not gate authoring, since
      the ratified four-term disposition ranking (node rank, graph position with
      keystone dispositions prioritized, timestamp, disposition category)
      supersedes the penalty machinery that clause rode on."
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
# Build /exetasis and the virtual review node — a derived, rank-ordered review target over durable-layer dispositions un-reviewed since they last changed, with a per-node reviewed stamp

## Context

`strategy-graph-review-curriculum` records a standing requirement: the whole
graph is subject to a recurring review curriculum, because deferrals calcify
into dogma, author knowledge atrophies, and delegations are forgotten. As of
this plan the doctrine is fully recorded and **nothing is built** — measured:

- `.claude/skills/exetasis/` does not exist (`ls .claude/skills/` shows
  `align-audit`, `reading-review`, `review-fix`, `review-plan`, `rsi-audit` and
  no review-sitting skill).
- No occurrence of the disposition vocabulary or any per-node reviewed
  fingerprint exists under `packages/intentionsutil/src/`.
- `grep -roh "(decision: [a-z-]*" intentions/` returns 19 stamps total:
  11 `deferred`, 5 `delegated`, 3 `author-ratified`.
- `grep -roh "delegated-pending-review\|delegated-review-declined" intentions/`
  returns 26 + 11 across 9 files — the interim vocabulary.

So every clarification describing selecting, ranking, or stamping is describing
a design, not a running system. This node builds it.

**What the doctrine asks for** (authoritative:
`intentions/strategy-graph-review-curriculum.md`, the 2026-08-30 clarifications
"How is the next review sitting selected…", "How does the adjacent-/align path
discharge review debt…", and "How does the 2026-08-30 disposition model change
this strategy…"):

- **One virtual review node.** Always exists, *derived* never stored, always
  carries the rank of the highest-ranked un-reviewed durable-layer content and
  points at it. No review node is created, ranked, or retired per target — that
  is the whole point: one derived fixture replaces N born-parked nodes.
- **Rank resolves live at selection time**, so it can never go stale.
- **Fully virtual review items** (author-ratified, 2026-08-30 continuation):
  nothing mints a stored review node, review-later deferrals included. The
  queue derives from stamps. Fold-in is automatic — the sitting reads stamps.
- **The unit of selection is a DISPOSITION, not a node** (author-ratified,
  2026-08-30 resolution round). A disposition is the thing that can be
  ratified, deferred, or delegated; a node carries many. Ranking =
  f(node rank, graph position with keystone dispositions prioritized,
  timestamp, category); category order **deferred > null > ratified >
  delegated**.
- **Change-gate.** Content needs no further review, as leaf or as ancestor,
  unless it changes. An ancestor changing does *not* dirty its descendants;
  consequences propagate by the reviewer amending a descendant, which changes
  it, which re-enrolls it. Forced subtree re-review would restore the
  per-node-schedule cost this design exists to avoid.
- **Ancestry-first.** Reviewing content reviews its un-reviewed ancestors
  first, root-first, then the target.
- **"Changed" = a per-kind review fingerprint** (author-ratified): strategies →
  the freeze-substance set PLUS `rationale`; other durable kinds → `statement` +
  `rationale` + `clarifications` + kind-normative attributes; router-owned
  stamps excluded everywhere. Reviewed stamp = `{fingerprint, date}`, stale iff
  they differ.
- **Detection is derived, never a manual sitting step** (Claude-owned,
  review-declined): the reviewed stamp additionally attests the fingerprints of
  the node's DIRECT ancestors; when an ancestor's current fingerprint diverges
  from an attested one, every holder of the stale attestation mechanically
  gains a consistency-unknown term. One level only — that is the blast-radius
  bound.
- **Sitting scope** (author-ratified): single-disposition review with
  opportunistic **may**-batch of hot-context sibling dispositions on the same
  node — never *must*, so the ranking's attention allocation is not bypassed
  and sittings stay bounded.
- **Virtues are reviewed as ancestors, never ranked directly** (author-ratified)
  — preserves `kind-kind`'s virtues-stay-unranked doctrine.
- **Mount records (tradition, delegation) are NOT review subjects**
  (author-ratified, superseding the interim kind-tradition clause): they carry
  no author dispositions; reference accuracy is objective and repaired through
  normal QA/office-hours processes. Kinds inherit rank via keystone position.
- **Legacy-null migration**: every decision recorded before the three-state
  model carries state `null` (stamp ABSENCE, not a fourth enum value).
  "Unreviewed" includes all of it, so the queue's initial population is the
  whole durable layer. Null is transitional — once legacy declarations drain,
  the lint forbids it.
- **/exetasis supersedes every other author-owned graph review process** except
  telemetry monitoring (the WIP dashboard). In particular the curriculum
  reading-and-review program is DEPRECATED: tradition reading and review arrive
  as deferred dispositions in the /exetasis queue instead, and the sitting
  metadata model must capture the deprecated program's outputs (what the author
  learned, reinforcement material, frontier extensions) so nothing it produced
  is lost.
- **Interview minimum, everywhere** (author verbatim): "interview responses
  always include (at least) recommendation, accept as deferred for review,
  accept as delegated (don't care)".

**Name.** The skill is `/exetasis` — the Socratic examination (*ho anexetastos
bios*, Apology 38a), author-chosen at the 2026-08-30 migration round over the
recommended `/examen`. It is a NEW function, distinct from the deprecated
`/align-audit`, and distinct from `/align-review`, which is claimed by
`tactic-align-review-skill` for adversarial review of drafts at record time —
do not merge them. The earlier `/node-review` draft name survives only in this
node's id, which stays as-is.

**Greenfield vs. brownfield.** The greenfield design is the one described
above and implemented below: one derived queue over dispositions, one stamp,
one comparator, no stored review nodes. The only concessions to the existing
system are two, both stated at their unit: (a) `coverage.ts` /
`review-coverage.ts` implement the *superseded* mode-A/mode-B frontier-entry
design and are retired rather than extended; (b) `office-hours-select.ts`'s
`--list` stdout contract is parsed positionally by an out-of-package consumer,
so review rows are additive behind an opt-in flag rather than injected into the
existing rows.

**Sizing.** This is larger than one PR. Units 1–5 are the minimum coherent
shipment (schema → derivation → CLI → skill → retirement of the superseded
sensor); units 6–7 are enforcement and migration and may land as a follow-up PR
on the same node. Sequence them in the order given; the dependencies are stated
per unit.

**Bootstrap decision (this plan settles it): COLD START.** Do not seed reviewed
stamps from dated clarifications, completed reading chunks, or any other
existing evidence. A seeded stamp would be an attestation no sitting made, and
`.claude/rules/code-style.md` forbids exactly that class of plausible-looking
fabrication. The consequence, stated so nobody reads it as a regression: the
backlog begins at full durable-layer size, and the `success_signal`'s
"un-reviewed across 2+ consecutive cycles trends down" clause has no useful
reading until at least three cycles have run. The *first* clause ("each cycle's
sitting reviews the then-pointed disposition") is readable from cycle one.

**Measured data defect to handle, not to silently absorb.** Ratified doctrine
says mount records carry no author dispositions, but two do today:
`intentions/tradition-hacker-culture.md:41` and
`intentions/tradition-motivation-psychology.md:45` each carry
`(decision: deferred, delegation-anthropic-claude, 2026-08-30)`. The derivation
must exclude mount records from the queue **and report these as a defect on
stderr**, never rank them and never drop them silently.

### Boundaries with sibling nodes — do not duplicate

- `tactic-align-indifference-option` (status raw) owns encoding the three-state
  decision model into the `/align` skill surface, including "stamps not minted
  review nodes" and the recommendation / accept-as-deferred /
  accept-as-delegated question mechanics. **Out of scope here.** Unit 6 touches
  `.claude/skills/align/SKILL.md` only for the adjacency duty and the two dead
  sensor citations.
- `tactic-substantiation-edge-migration` (status raw) owns the vocabulary sweep
  `delegated-pending-review → deferred`, `delegated-review-declined →
  delegated`. **Out of scope here.** The parser in Unit 2 therefore reads both
  spellings tolerantly rather than pre-empting the sweep.
- `tactic-rsi-graph-review` (parked to office_hours) owns batch review of
  **delegated**-state dispositions. `/exetasis` reviews **author** dispositions
  only — deferred, null, and ratified re-queues. The boundary doctrine stands
  unchanged even though that node is parked.
- `tactic-align-audit-retirement` (phase: implement) deletes
  `.claude/skills/align-audit/`. **Do not delete it here** — it is still on
  disk and that removal is that node's diff.
- `tactic-keystone-decomposition-reorg` (parked to office_hours) owns what
  "keystone position" means. No code implements it (`grep -rn "keystone"
  packages/intentionsutil/src/` → zero hits). Unit 3 implements graph position
  as root-distance, the author-ratified direction ("closer to the roots is
  reviewed sooner"), and leaves the keystone refinement as a documented
  extension point.
- `tactic-attention-per-tier-boost-migration` rewrites `boost` → `boosts` on
  many node frontmatters including this strategy's. It changes no code this
  plan touches; no sequencing constraint.

### Deferred decision carried forward, not resolved here

The unpenalized-rank clause — *"a derived item is not a minted park, so no 0.5x
re-pick penalty"* — is held **deferred** (decision: deferred,
delegation-anthropic-claude, 2026-08-30). This plan therefore does **not**
implement a penalty exemption. Unit 3 applies the existing
`SESSION_TYPE_PENALTY` treatment unchanged to review candidates
(`packages/intentionsutil/src/officeHours.ts:13`, `sessionTypePenalty`), which
is the status-quo rule applied to a new member class, and records the deferral
as a review item the first /exetasis sitting can settle. Implementing the
exemption would be executing an undecided disposition.

---

## Unit 1 — Review fingerprint and the reviewed stamp

**Scope.** New module `packages/intentionsutil/src/review.ts` (fingerprint and
stamp half only; the queue lands in Unit 3), plus one new `validateGraph` rule
in `packages/intentionsutil/src/schema.ts`. New test file
`packages/intentionsutil/test/review.test.ts`.

Export from `review.ts`:

- `EXETASIS_SUBJECT_KINDS: readonly string[] = ["virtue", "strategy", "kind"]`.
  This is a FOURTH durable-layer set and must carry a doc comment saying so and
  why, following the precedent at `packages/intentionsutil/src/schema.ts:616-628`
  (which documents why `DURABLE_LAYER_KINDS` deliberately differs from
  `grounding.ts`'s). The three existing sets and how this one differs:
  - `packages/intentionsutil/src/coverage.ts:32` — virtue/strategy/kind/
    tradition/delegation (the superseded coverage sensor; retired in Unit 5).
  - `packages/intentionsutil/src/grounding.ts` `DURABLE_KINDS` — virtue/
    strategy/kind/delegation (which nodes must carry a grounding mark).
  - `packages/intentionsutil/src/schema.ts:629` `DURABLE_LAYER_KINDS` —
    virtue/strategy/delegation/kind/tradition (the unattended-writer fence).
  Ours excludes `tradition` and `delegation` because mount records carry no
  author dispositions (ratified 2026-08-30). **Do not unify the sets** — they
  answer different questions, and merging them would put mounts back in the
  review queue.
- `ROUTER_OWNED_ATTRIBUTE_KEYS: ReadonlySet<string>` — the attribute keys
  excluded from every fingerprint because machinery writes them:
  `reviewed`, `tier`, `bug_fix`, `security`, `boost`, `boosts`,
  `last_assessed`, `last_exercised`, and every `wait_*` key
  (`wait_for`, `wait_until`, `wait_attempts`, `wait_reason`,
  `wait_recommendation` — see `schema.ts` rule 22 at
  `packages/intentionsutil/src/schema.ts:1793`). **`reviewed` MUST be in this
  set** — a fingerprint that covered its own stamp would be invalidated by the
  act of stamping, so every sitting would immediately re-enroll its own target.
  Add an explicit unit test asserting that.
- `reviewFingerprint(node: IntentionNode): string` — sha256 over canonical JSON,
  mirroring `strategyFingerprint`'s construction exactly
  (`packages/intentionsutil/src/router.ts:103-113`). Per-kind substance:
  - `kind === "strategy"`: the freeze-substance set **plus** `rationale` — i.e.
    `{statement, clarifications, conditions: attributes.conditions ?? null,
    serves: [...serves].sort(), success_signal, tooling_goals, rationale}`.
    Reuse `strategyFingerprint`'s field selection verbatim rather than
    re-deriving it, so the two cannot drift.
  - every other subject kind: `{statement, rationale, clarifications,
    attributes: <attributes minus ROUTER_OWNED_ATTRIBUTE_KEYS, key-sorted>}`.
    "Kind-normative attributes" resolves to *the whole attributes bag minus the
    router-owned deny set* — a deny-list, not an allow-list, for the same
    fail-closed reason `isDurableWriteRefused`
    (`packages/intentionsutil/src/schema.ts:657`) is negative: an unanticipated
    new attribute must count as substance, not silently vanish from the
    fingerprint.
- `interface ReviewStamp { fingerprint: string; date: string; ancestors:
  Record<string, string>; outcomes?: { learned?: string[]; reinforce?: string[];
  frontier?: string[] } }` and `parseReviewStamp(node): ReviewStamp | null`.
  `ancestors` maps direct-ancestor id → that ancestor's `reviewFingerprint` as
  attested at sitting time (the one-level blast-radius bound). `outcomes` is
  the sitting-outcome metadata the doctrine requires be machine-readable:
  `learned` (what the author learned), `reinforce` (reinforcement material),
  `frontier` (frontier extensions the sitting identified) — these are the
  deprecated reading program's outputs, preserved.
- `isReviewStale(stamp: ReviewStamp | null, currentFingerprint: string): boolean`
  — mirror `isScopeStale` (`packages/intentionsutil/src/transitions.ts:492`)
  and `isFingerprintStale` (`:525`). **`null` is stale here**, unlike both
  precedents: absence means never reviewed, which is exactly the legacy-null
  population the queue must surface. Say so in the doc comment, because it
  inverts the precedent's polarity.

**Storage location:** `attributes.reviewed`. Rationale to record in the doc
comment: `attributes` is the documented home for non-first-class fields, it
already hosts machinery-written stamps (`last_assessed`, `last_exercised`,
parsed by `coverage.ts`'s `collectStampStrings`), and `reviewed` is not an
`IntentionNode` field name so it does not trip rule 23's shadow-ban
(`packages/intentionsutil/src/schema.ts:1812`). Adding a first-class field
instead would force an `IntentionNode` + `FIRST_CLASS_FIELD_PROBE` change
(`packages/intentionsutil/src/schema.ts:220`, `:267`) for a cross-kind stamp
that no existing first-class field shape fits.

**Caveat to record in the doc comment:** `attributes` is NOT in `STATE_FIELDS`
(`packages/intentionsutil/src/schema.ts:605`), so `isDurableWriteRefused`
refuses an *unattended* writer that stamps a durable node. That is correct and
deliberate: an /exetasis sitting is author-attended, and no autonomous path may
manufacture an attestation. Do not add `attributes` to `STATE_FIELDS`, and do
not add a fence exemption.

**New `validateGraph` rule — claim number 25, not 24.** The rule-number
collision note at `packages/intentionsutil/src/schema.ts:1827-1831` records
that `tactic-supersession-edge-and-terminal` already claims 23 and 24 (unlanded
as of 2026-08-29), and burned numbers are never reused. Claim 25 and extend the
collision note to record this claim so the next claimant sees it. Rule 25
shape, following rules 19/21/22 (inert when the key is absent, shape-checked
when present): `attributes.reviewed`, when present, is an object with
`fingerprint` a non-empty 64-char lowercase hex string, `date` a `YYYY-MM-DD`
string, `ancestors` a record of string → 64-char hex, and `outcomes`, when
present, an object whose `learned`/`reinforce`/`frontier` are arrays of
non-empty strings. A `reviewed` key on a non-subject kind (tradition,
delegation, tactic) is a violation — mount records carry no dispositions, so a
stamp on one is malformed data, and rejecting it here is what keeps the two
measured tradition stamps from quietly becoming legitimate.

**Out of scope:** the queue, the priority function, any CLI, any skill file,
any change to `coverage.ts`, and any migration of existing `(decision: …)`
prose.

**Recommended model:** opus.

---

## Unit 2 — The disposition parser

**Scope.** Add to `packages/intentionsutil/src/review.ts` a pure parser over
node text. Tests in `packages/intentionsutil/test/review.test.ts`.

A disposition is an inline prose stamp — that is what actually exists in the
store today, and the grammar is recorded on `strategy-explicit-intent` (the
"How were the migration and sustenance rounds reviewed" clarification, grammar
note H11, at `intentions/strategy-explicit-intent.md:719-724`):

```
(decision: <state>, <delegatee>, YYYY-MM-DD)   # deferred and delegated
(decision: <state>, YYYY-MM-DD)                # ratified — delegatee omitted
```

Export:

- `type DispositionState = "ratified" | "deferred" | "delegated"`.
- `parseDispositions(nodeId: string, kind: string, text: string):
  DispositionRecord[]` where `DispositionRecord = { nodeId, state, delegatee:
  string | null, date: string, key: string, excerpt: string }`. `key` is a
  stable identifier for the disposition within its node — use
  `<nodeId>#<ordinal>` over stamps in document order, so a sitting can name
  exactly which disposition it reviewed and the queue can be diffed across
  cycles. `excerpt` is a bounded (≤200 char) slice of surrounding text so the
  queue is readable without opening the node.
- State normalization, tolerant by design: `author-ratified` and `ratified`
  both map to `ratified`; `delegated-pending-review` maps to `deferred`;
  `delegated-review-declined` maps to `delegated`. This mirrors
  `isFingerprintStale`'s three-shape tolerance
  (`packages/intentionsutil/src/transitions.ts:508-534`) and deliberately does
  not pre-empt `tactic-substantiation-edge-migration`'s rename sweep. An
  unrecognized state token is an error naming the node and the excerpt — never
  silently skipped (`.claude/rules/code-style.md`).
- `MOUNT_KINDS = ["tradition", "delegation"]` and a `mountDispositionDefects()`
  helper returning every disposition found on a mount record. The two measured
  cases (`intentions/tradition-hacker-culture.md:41`,
  `intentions/tradition-motivation-psychology.md:45`) are the live fixture for
  this; the derivation in Unit 3 reports them on stderr and excludes them from
  the queue.

The parser needs BODIES, not just frontmatter — this node's own deferred
clause lives in its body, and `strategy-explicit-intent`'s live in
clarification answers. Clarification answers arrive via `node.clarifications`;
bodies arrive from `readNodeBody` (`packages/intentionsutil/src/store.ts:166`)
at the script layer. Keep `review.ts` pure and fs-free — it takes
`(node, bodyText)` pairs, exactly as `computeReviewCoverage` takes a
`bodyById` map (`packages/intentionsutil/src/coverage.ts:178`).

**Out of scope:** rewriting any existing stamp, the vocabulary sweep, and any
change to how `/align` writes stamps.

**Dependencies:** Unit 1.

**Recommended model:** opus.

---

## Unit 3 — The virtual review node: derivation, priority, ancestry-first

**Scope.** Add the queue half to `packages/intentionsutil/src/review.ts`.
Tests in `packages/intentionsutil/test/review.test.ts`.

Export `reviewQueue(nodes, bodyById): ReviewQueue` where
`ReviewQueue = { items: ReviewItem[]; head: ReviewItem | null; defects:
string[] }` and `ReviewItem = DispositionRecord & { rank: RankKey; position:
number; consistencyUnknown: boolean; category: DispositionState | "null" }`.

**Population (the change-gate as a filter, not a term).** An item enters the
queue only when its host node's `attributes.reviewed` is absent or stale
against `reviewFingerprint(node)` — that is the change-gate. A node whose stamp
matches contributes nothing, however many dispositions it carries. Additionally,
each subject-kind node with **no** disposition stamps at all and no reviewed
stamp contributes exactly one synthetic `category: "null"` item keyed
`<nodeId>#null` — this is the legacy-null population, which is initially the
whole durable layer.

**Exclusions.** Mount kinds are excluded entirely; their dispositions go to
`defects`. Tactics contribute their explicit `(decision: …)` stamps but never a
synthetic null item — the legacy-null census is scoped to virtue/strategy/kind
(mounts and tactics excluded) per the ratified drain design, and a tactic's
substance is covered through its serving strategy. Record this asymmetry in the
doc comment; it is the one place the "durable layer" and "where dispositions
live" sets legitimately differ, and this node's own deferred clause is the
worked example of a tactic-hosted disposition that must be reviewable.

**Priority — implement the ratified key order verbatim**, lexicographically,
in this sequence:

1. **Node rank**, descending, via `compareRankKeyDesc`
   (`packages/intentionsutil/src/attention.ts:39`) over the host node's
   `resolveAttention` entry (`:459`). A node absent from the map — every
   non-goal-layer kind, i.e. virtue and kind, since only `kind-tactic` and
   `kind-strategy` carry `attributes.goal_layer: true` — takes the neutral
   baseline `{tier: 1, band: 0, score: 0, depth: 0}`, matching
   `officeHoursQueue`'s own default at
   `packages/intentionsutil/src/officeHours.ts` (the `resolved?.tier ?? 1`
   block). Apply `sessionTypePenalty` to band and score exactly as
   `officeHoursQueue` does, treating review items as `curriculum-review` — see
   the deferred-decision note in Context; do NOT exempt them.
2. **Graph position**, root-closer first. Compute root-distance as the minimum
   hop count to a `kind: "virtue"` node over `parent` + `serves` edges — the
   same edge pair `buildAncestryProjection` walks
   (`packages/intentionsutil/scripts/node-ancestry.ts:173`). Virtues are
   distance 0. A `kind: "kind"` node has no `serves`/`parent` path to a virtue;
   assign it distance 0 as well, and record the reason: kinds are keystones and
   "kinds inherit rank via their keystone position" (ratified), but no code
   implements keystone position (`grep -rn "keystone"
   packages/intentionsutil/src/` → zero hits) and its defining node
   `tactic-keystone-decomposition-reorg` is parked for author rulings. Leave a
   named extension point (`keystonePosition?: (node) => number`) and a comment
   pointing at that node.
3. **Consistency-unknown**, true first. True when the host node's reviewed
   stamp attests a direct-ancestor fingerprint that diverges from that
   ancestor's current `reviewFingerprint`. Direct ancestors = the union of
   `parent` and `serves` targets, one level only — that IS the blast-radius
   bound, so do not transitively close it.
4. **Timestamp**, older first (the disposition's own `date`; the synthetic null
   item takes the node's newest clarification date via `readingDate`
   (`packages/intentionsutil/src/router.ts:271`), or the empty string when the
   node carries none, which sorts oldest and is the right default for content
   nobody has dated).
5. **Category**: `deferred` > `null` > `ratified` > `delegated`.
6. **`key` ascending** as the total-order tiebreak, so `head` is deterministic.

Record in the doc comment where the *earlier* author-ratified priority shape
went: `f(graph position, unreviewed-change state, pending-review stamp
density)`. Under the later disposition-unit model, unreviewed-change state
became the population filter and stamp density became the category ordering —
a node holding many deferred stamps contributes many top-category items. The
density term is **not dropped**; say so explicitly, because it is recorded as
load-bearing and a future reader will look for it.

**Ancestry-first** is a property of the sitting, not of the ranking: export
`ancestryPrefix(nodes, item): string[]` returning the host node's un-reviewed
ancestors root-first (nearest-last), which the skill walks before the target.
Virtues appear here and only here — that is what "virtues are reviewed as
ancestors, never ranked directly" means mechanically, and it is why virtues
must never produce a queue item of their own. Add a test asserting no
`ReviewItem` has a `kind: "virtue"` host, and a companion test asserting a
virtue DOES appear in the `ancestryPrefix` of a strategy that serves it.

`head` is the virtual review node: `items[0]`, or `null` when the queue is
empty. It is computed, never written anywhere. Nothing in this unit performs a
graph write.

**Out of scope:** any CLI, any skill, any office-hours-queue change.

**Dependencies:** Units 1, 2.

**Recommended model:** opus.

---

## Unit 4 — `exetasis-select.ts` and the office-hours composition

**Scope.**

(a) New `packages/intentionsutil/scripts/exetasis-select.ts`, following the
pure-store-read stdout-only script precedent of
`packages/intentionsutil/scripts/review-coverage.ts` and the ref-reading
posture of `packages/intentionsutil/scripts/office-hours-select.ts`. Resolve
the repo root from `import.meta.url`, never cwd (the convention both those
scripts state in their headers). Read the store **at a git ref** (default
`origin/main`) for the reason `office-hours-select.ts`'s header gives verbatim:
a selector reading its own checkout answers from whatever that worktree last
synced, so a stale worktree silently reports stale review state.

Use `listNodesAtRef` (`packages/intentionsutil/scripts/lib-store-at-ref.ts:47`)
— **strictly**, which it already is, and that matters here for the same reason
it matters in `select-targets.ts`: a durable node the tolerant reader silently
drops would silently vanish from the review backlog. The parser needs bodies,
which `listNodesAtRef` does not return; extend that file with
`listNodeTextsAtRef(repoRoot, ref): { node, body }[]` reusing the same
`git archive` + `tar -x` materialization and the same two-separately-checked-
`execFileSync` discipline its header insists on (a shell pipeline without
`pipefail` yields a silently empty store).

stdout contract, exactly one line except `--list`:

```
review <node-id> <disposition-key> <category>   — the virtual review node's target
empty                                           — nothing un-reviewed
```

`--list` emits `<score>\t<category>\t<nodeId>\t<disposition-key>\t<date>` rows.
`--json` emits the whole `ReviewQueue`. Mount-record defects and any parse
error go to **stderr** and set a non-zero exit — clear errors over fallbacks;
a review queue that silently swallowed malformed dispositions would under-report
review debt, which is precisely the signal this build exists to produce.

(b) `packages/intentionsutil/scripts/office-hours-select.ts` gains an
**opt-in** `--with-review` flag. With it, `--list` interleaves review rows into
the parked rows by the same `compareRankKeyDesc` order with the sessionType
column reading `exetasis`, and queue-head mode may emit a
`review <node-id> <disposition-key>` disposition line.

**The flag is opt-in, and that is a deliberate migration concession, not the
greenfield shape.** The greenfield is one queue with two member classes. Two
existing consumers make default-on unsafe:
`.claude/skills/dispatch-propagate/scripts/dispatch-terminal-gap-audit` parses
`--list` rows POSITIONALLY with `IFS=$'\t' read -r _rank _stype nid _since`
and would read a review row's node id as a parked node — the header of
`office-hours-select.ts` calls out this exact consumer and this exact silent
misparse; and `packages/intentionsutil/scripts/office-hours-graph` walks
`--list` top-down and launches the first free node, but a review item has no
worktree and no park record, so an autonomous launcher must never try to launch
one. Default-off leaves both untouched. Do **not** change `office-hours-graph`
in this unit.

(c) `.claude/skills/office-hours/SKILL.md` gains one paragraph in its
graph-native mode: the human lane reads the queue with `--with-review`, and a
`review` disposition line means run `/exetasis` with that disposition key
rather than launching a parked node.

**Out of scope:** `office-hours-graph`, `dispatch-terminal-gap-audit`, the
autonomous dispatch queue, and any change to the existing four `--list`
columns.

**Dependencies:** Unit 3.

**Recommended model:** opus.

---

## Unit 5 — The `/exetasis` skill, and retiring the superseded coverage sensor

**Scope.**

(a) New `.claude/skills/exetasis/SKILL.md`. Mirror the section structure of its
sibling `.claude/skills/reading-review/SKILL.md` — Trigger and selection /
Session flow / Session bounds / Recording rules / Landing / Prohibitions /
Reuse / Verification (headings at `.claude/skills/reading-review/SKILL.md:45`,
`:145`, `:170`, `:196`, `:577`, `:589`, `:596`, `:618`). Frontmatter takes
`name: exetasis`, `user-invocable: true`, and a description saying it is an
interactive office-hours sitting that reviews one graph disposition.

Content the skill must carry:

- **Selection.** Run `exetasis-select.ts`; with no argument take the head, with
  a disposition key take that item. Walk `ancestryPrefix` root-first before the
  target — the ancestry-first rule.
- **Sitting form.** Single-disposition, with opportunistic **may**-batch of
  sibling dispositions on the same node while its context is hot — never must.
  State the reason inline: batching by default would bypass the ranking's
  attention allocation and unbound the sitting.
- **Two content classes in one sitting.** Mode A (re-validation of
  deferred/delegated content — collect the source: the reading, the exercise,
  the world state) and Mode B (confirmation of author-owned content — collect
  recursively broadened context). These are names for *what the author collects
  beforehand*, not separate enrollment paths; one sitting covers both halves of
  its target.
- **The author articulates first.** Probes cite the record and the collected
  sources; the author states their position before Claude offers one. This is
  the type-b sitting rule that holds the capture loop controlled, and it is why
  this skill can conduct reviews of a record Claude helped draft.
- **Interview minimum** (author verbatim): every question offers at least the
  recommendation, accept-as-deferred-for-review, and accept-as-delegated
  ("don't care").
- **Capture call-out.** During the sitting, read the target's disposition
  stamps and graft edges plus its direct ancestors', and flag position-weighted
  outliers per `strategy-graph-mounts`' capture model. Use
  `packages/intentionsutil/src/attention.ts`'s `captureScore` /
  `captureAddendFor` as canonical — `grounding.ts`'s `divergenceRank` /
  `gatedRank` / `delegationScore` is a reporting-only duplicate, per its own
  comment, and must not be the ranking authority.
- **Recording.** The sitting writes `attributes.reviewed` on the target
  (fingerprint, date, direct-ancestor attestations) and records
  `outcomes.learned` / `outcomes.reinforce` / `outcomes.frontier`. This is
  where the deprecated reading program's outputs now live. Amending the node's
  substance during the sitting changes its fingerprint, which re-enrolls it —
  that is correct and expected; stamp AFTER the amendment, in the same commit.
- **Landing.** One `graph-commit` per sitting. Per `.claude/rules/sandbox.md`,
  `graph-commit` runs with `dangerouslyDisableSandbox: true` on the FIRST
  attempt and takes an explicit `-C <repo root>`, with a single-line `-m`.
- **Prohibitions.** Never mint a stored review node — for any disposition,
  review-later deferrals included. Never file a GitHub issue. Never write a
  reviewed stamp for a node the sitting did not actually review. Never review a
  mount record. Never rank a virtue directly.
- **Supersession, stated on the skill surface.** /exetasis supersedes every
  other author-owned graph review process except telemetry monitoring; the
  curriculum reading-and-review program is deprecated and its material arrives
  here as deferred dispositions. `/exetasis` is not `/align-audit` (deprecated,
  deleted by `tactic-align-audit-retirement`) and not `/align-review` (owned by
  `tactic-align-review-skill`).

(b) Delete `packages/intentionsutil/src/coverage.ts`,
`packages/intentionsutil/scripts/review-coverage.ts`, and
`packages/intentionsutil/test/coverage.test.ts`. They implement the
**superseded** pre-2026-08-30 mode-A/mode-B frontier-entry design and treat
tradition/delegation as review subjects, which the resolution round reversed.
The review-debt queue replaces the coverage table wholesale. Update the two
referencing sites: `.claude/skills/reading-review/SKILL.md:654` (which tells a
sitting to run the retired script) and
`packages/intentionsutil/SEPARABILITY.md:59`. `readingDate`
(`packages/intentionsutil/src/router.ts:271`) stays — Unit 3 uses it and rule
17 documents it.

Note for whoever runs this unit: `coverage.ts`'s deletion also removes
`lastReviewedOf`'s date-only staleness, which is intended — the per-kind review
fingerprint replaces it. `tactic-align-audit-retirement` already flags this
staleness and explicitly scopes the replacement to this node.

**Out of scope:** deleting `.claude/skills/align-audit/` (that is
`tactic-align-audit-retirement`'s diff), and any `/align` edit (Unit 6).

**Dependencies:** Unit 4.

**Recommended model:** opus.

---

## Unit 6 — The `/align` adjacency duty, and two dead sensor citations

**Scope.** `.claude/skills/align/SKILL.md` only.

(a) **Encode the ratified adjacency duty.** Add it to the interview mechanics,
near the "Question mechanics" and "Deferral mechanics" subsections
(`.claude/skills/align/SKILL.md:275` and the "Deferral mechanics" heading
immediately below it). Verbatim substance, ratified and binding:

> A legacy-null disposition is **adjacent** to an /align round iff the round
> quotes it, amends it, or touches an edge incident to it — nothing else
> qualifies, so a round cannot ratify arbitrary content by declaring it
> adjacent; the criterion is auditable from the round's own diff. Any adjacent
> legacy-null disposition MUST be dispositioned in that round. **Silence on an
> adjacent null disposition is a defect of the round.**

Also record the attestation consequence: an /align adjacent-doctrine
ratification writes the same `attributes.reviewed` stamp `{fingerprint, date}`
that an /exetasis sitting writes, so both paths end in the same attestation and
the virtual review node's predicate drops the node either way. Without this,
adjacent-ratified content would sit atop the queue forever — the incoherence
the post-hoc review found.

(b) **Fix the two dead citations.** `.claude/skills/align/SKILL.md:326` and
`:751` both cite `tactic-review-curriculum-coverage-sensor` as the sensor
deriving curriculum-frontier linkage by id-matching. That node is absent from
`intentions/` (confirmed) and the sensor it named is deleted in Unit 5. Remove
the parenthetical citation and the "invisible to it" clause that depends on it
at both sites.

**Explicitly out of scope, and stated so the implementer does not drift into
it:** the surrounding "Deferral mechanics" prose still instructs rounds to
mint born-parked review items ("Create exactly one review item, born-parked, in
the same `graph-commit`", `.claude/skills/align/SKILL.md:~313`). Replacing
minting with stamping is `tactic-align-indifference-option`'s scope, as is the
recommendation/deferred/delegated question-option encoding. Do not touch that
paragraph beyond deleting the dead sensor citation embedded in it. Leave a
one-line pointer comment naming `tactic-align-indifference-option` so the
inconsistency is visible rather than silent.

**Dependencies:** Unit 5 (the citation removal must not precede the deletion it
describes).

**Recommended model:** sonnet.

---

## Unit 7 — The stamp-drain lint and the legacy-null census

**Scope.** The delegated migration detail (decision: delegated,
delegation-anthropic-claude, 2026-08-30 — author: "don't care, it's a migration
detail"), which means Claude picks the mechanism but the shape is fixed:

(a) New `packages/intentionsutil/scripts/exetasis-drain-census.ts`: counts
author dispositions on **virtue/strategy/kind** nodes recorded before
2026-08-30 that carry no reviewed stamp — mounts and tactics excluded. Pure
store read, stdout only, repo root from `import.meta.url`. Follows
`review-coverage.ts`'s script shape (which Unit 5 deletes — copy the shape, not
the file).

(b) Extend the Unit 1 rule-25 validation with the drain rule: the null marker
is stamp **ABSENCE**, not a fourth enum state, and it is tolerated only while
legacy declarations remain. Wire the census count into the lint so that at
count zero the lint mechanically forbids absence on subject-kind nodes. Gate it
on the count rather than a hand-flipped flag — that is the "mechanical flip"
the drain design asks for, and a hand flag would need a human to notice the
drain finished.

(c) A diff-scoped check that a `deferred` or `delegated` stamp survives
revision of its content — it may become `ratified` only alongside a reviewed
stamp in the same commit, never silently. Home: a new function in
`packages/intentionsutil/src/planlint.ts` if it can be expressed over node
content, otherwise a shell lint beside
`.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh`, registered in
`run-lint.sh` alongside the existing `lint-prose-rules.sh` /
`lint-verify-fence-paths.sh` / `lint-vendored-skills.sh` calls
(`.claude/skills/dispatch-propagate/scripts/run-lint.sh:145`, `:179`, `:200`).
Prefer the `planlint.ts` home — it is already wired into `validate-graph.ts`
after `validateGraph` and needs no new CI registration.

**Out of scope:** performing the drain (rewriting existing stamps), and the
`delegated-pending-review → deferred` vocabulary rename
(`tactic-substantiation-edge-migration`).

**Dependencies:** Unit 1 (rule 25), Unit 2 (the parser the census uses).

**Recommended model:** opus.

---

## Reuse

Reuse these rather than re-deriving them. Every path is repo-relative from the
repo root; anchors are symbol-first because line numbers drift.

- `packages/intentionsutil/src/router.ts` — `strategyFingerprint` (~:103): the
  canonical sha256-over-canonical-JSON-of-substance-fields construction, and
  the source of the strategy freeze-substance field set Unit 1 extends with
  `rationale`. `tacticScopeFingerprint` (~:134) is the same pattern over a
  `{statement, body}` pair. `readingDate` (~:271) extracts the newest ISO date
  from free text — Unit 3's null-item timestamp.
- `packages/intentionsutil/src/transitions.ts` (550 lines total) —
  `isFingerprintStale` (~:525), the staleness predicate Unit 1 mirrors,
  including its documented three-shape (null / legacy string / current object)
  tolerance; `stampHash` (~:508), the single home of that shape discrimination;
  `ScopeStamp` / `parseScopeStamp` / `isScopeStale` (~:467–:496), the simpler
  fingerprint+sha stamp precedent with the missing-stamp policy left to the
  caller.
- `packages/intentionsutil/src/attention.ts` — `RankKey` (:24),
  `compareRankKeyDesc` (:39), `resolveAttention` (:459): the shared rank key and
  its descending comparator. Compose into these rather than inventing a parallel
  ordering. `captureScore` / `captureAddendFor` (~:165–256) is the canonical
  capture-axis scoring for Unit 5's capture call-out.
- `packages/intentionsutil/src/officeHours.ts` — `QueueMember` (extends
  `RankKey`), `officeHoursQueue`, `sessionTypePenalty`, `SESSION_TYPE_PENALTY`
  (:13), `openBlockers`, `selectOfficeHours`: the existing ranked-queue shape a
  review item composes into, including the `resolved?.tier ?? 1` neutral
  baseline for nodes absent from the attention map.
- `packages/intentionsutil/src/schema.ts` — `IntentionNode` (:220),
  `FIRST_CLASS_FIELD_PROBE` (:267), `STATE_FIELDS` (:605),
  `DURABLE_LAYER_KINDS` (:629), `isDurableWriteRefused` (:657), and the
  numbered `validateGraph` rule docs (:1719–:1831, rule 23 at :1812, the
  rule-number collision note at :1827). Rules 19/21/22 are the shape-rule
  template Unit 1's rule 25 follows.
- `packages/intentionsutil/src/store.ts` — `readNode` (:153), `readNodeBody`
  (:166), `listNodes` (:232), `listNodesStrict` (:249), `writeNode` (:52): the
  single frontmatter write gate and read primitives. Never hand-roll
  frontmatter parsing.
- `packages/intentionsutil/scripts/lib-store-at-ref.ts` — `listNodesAtRef`
  (:47), `readNodeAtRef` (:100): read-the-store-at-a-ref, with the header's
  stated reasons for strictness and for the two separately-checked
  `execFileSync` calls. Unit 4 extends this file rather than starting a new one.
- `packages/intentionsutil/scripts/office-hours-select.ts` — the CLI contract
  precedent: `--ref` reading, the one-line stdout disposition contract, the
  `--list` column contract and its named out-of-package positional consumer,
  `--type` validation against `SESSION_TYPES`, and stderr-is-advisory-only.
- `packages/intentionsutil/scripts/review-coverage.ts` — the pure-store-read,
  stdout-only, repo-root-from-script-location sensor-script shape. Unit 5
  deletes it; copy the shape first.
- `packages/intentionsutil/scripts/node-ancestry.ts` —
  `buildAncestryProjection` (:173): the bounded BFS over BOTH `parent` and
  `serves` edges, nearest-first. Unit 3's root-distance and `ancestryPrefix`
  walk the same edge pair.
- `packages/intentionsutil/src/coverage.ts` — read before deleting:
  `computeReviewCoverage`'s `(nodes, bodyById)` signature is the purity
  convention Unit 2 keeps, and `collectStampStrings` shows the existing
  attribute-stamp scraping the fingerprint deny-list must cover.
- `.claude/skills/reading-review/SKILL.md` — the sibling sitting skill: section
  structure (:45, :145, :170, :196, :577, :589, :596, :618) and its own
  `## Reuse` / `## Verification` sections are the template for
  `.claude/skills/exetasis/SKILL.md`.
- `.claude/skills/office-hours/SKILL.md` — how a skill consumes the selector's
  stdout disposition line; Unit 4(c) adds one paragraph to its graph-native
  mode.
- `.claude/skills/dispatch-propagate/scripts/run-lint.sh` — the lint
  registration site (:145, :179, :200) if Unit 7(c) lands as a shell lint.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

Typecheck the touched workspace **explicitly**. `run-typecheck.sh` with no
arguments scopes itself to dirty apps and can pass vacuously; `--app` takes a
repo-root-relative workspace directory and cannot:

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The new selector must answer, and its answer must be non-empty on a cold graph
(every durable node is un-reviewed at bootstrap, so an `empty` result here means
the derivation is broken, not that the graph is clean):

```verify
node --import tsx/esm packages/intentionsutil/scripts/exetasis-select.ts --ref HEAD --json
```

The dead-citation removal. **Fence-shape constraint, measured 2026-08-30 while
writing this plan:** a worktree-isolated session's Bash tool refuses any command
containing command substitution ("too complex to verify that it stays inside the
worktree"), and a `&&`-joined compound had its non-zero exit swallowed in the
tool report. So each fence below is ONE simple command whose own exit code is
the assertion — no `$(…)`, no `&&`. The first fence is the anti-vacuity guard
for the second (a deleted or renamed skill file would make a negated grep pass
for the wrong reason):

```verify
test -f .claude/skills/align/SKILL.md
```

```verify
! grep -q 'curriculum-coverage-sensor' .claude/skills/align/SKILL.md
```

The retired sensor and its test are gone:

```verify
test ! -f packages/intentionsutil/src/coverage.ts
```

```verify
test ! -f packages/intentionsutil/scripts/review-coverage.ts
```

```verify
test ! -f packages/intentionsutil/test/coverage.test.ts
```

Nothing still names the retired script (`.claude/skills/reading-review/SKILL.md`
and `packages/intentionsutil/SEPARABILITY.md` are the two sites Unit 5 updates).
This fence matches prose mentions too, so the new `/exetasis` skill must narrate
the supersession without spelling the old script's name:

```verify
! grep -rq 'review-coverage' .claude packages/intentionsutil
```

**Manual and judgment checks — not auto-runnable:**

- **Run one real sitting.** The only end-to-end proof is an author-attended
  `/exetasis` sitting: take the head, walk the ancestry prefix, review one
  disposition, land the stamp via `graph-commit`, then re-run
  `exetasis-select.ts` and confirm the head **moved** and the reviewed node
  dropped out of the queue. That round trip — pointer, sitting, stamp, pointer
  moves — is the success_signal's first clause made observable, and it cannot
  be simulated: a fabricated stamp would prove nothing about the sitting.
- **Confirm the reviewed node stays out.** Re-run after an unrelated commit and
  confirm the stamped node has not re-enrolled. If it has, the fingerprint is
  covering a router-owned attribute it should be excluding — check
  `ROUTER_OWNED_ATTRIBUTE_KEYS` first, and `reviewed` itself first of all.
- **Confirm ancestor motion flags exactly one level.** Amend a strategy's
  `rationale`, then confirm its direct dependents gain
  `consistencyUnknown: true` and their dependents do NOT. Transitive flagging
  would restore the per-node-schedule cost this design exists to avoid.
- **Confirm the two mount-record defects are reported, not ranked.**
  `intentions/tradition-hacker-culture.md:41` and
  `intentions/tradition-motivation-psychology.md:45` must appear in `defects`
  and in no queue item.
- **Confirm the office-hours consumers are untouched.** With `--with-review`
  absent, `office-hours-select.ts --list` output must be byte-identical to its
  pre-change output on the same ref, and `office-hours-graph` must behave
  identically. Diff the two `--list` renders directly.
- **Success-signal reading.** The second clause ("durable nodes un-reviewed
  across 2+ consecutive cycles trends down") has no reading until at least
  three cycles have run — a cold start, decided above. Do not record a reading
  that says otherwise, and do not read the initial full-size backlog as a
  regression.
