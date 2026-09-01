---
id: tactic-migration-frontier-projection
kind: tactic
statement: Derive brownfield migration frontiers — observe-mode target rules
  whose reported frontier is the remaining migration, with drain-then-ratchet
  mechanics and deprecation as migration-to-absence
owner: ai
status: codified
parent: null
rationale: "Delegated by the 2026-08-31 /align doctrine-alignment round under
  the ratified projection disposition (strategy-graph-native-dispatch,
  2026-08-31). Tradition reference: Terraform plan / the IaC reconciliation loop
  — the bridge between current and desired state is derived at execution time,
  never stored, so it cannot stale. Replaces stored migration step-lists, the
  author's named regression source."
reading: null
serves:
  - strategy-graph-native-dispatch
  - strategy-graph-integrity
recovers: []
clarifications:
  - question: Drift review [1] - is the serving strategy's owed
      legacy-signal-to-criteria migration a blocker for this finalize
      (2026-09-01)?
    answer: "(Recorded 2026-09-01 /align-tactics per-node drift review.) OWED
      LEGACY-SIGNAL MIGRATION, still pending — not a blocker for this node's
      plan. strategy-graph-native-dispatch's success_signal (2026-09-01
      amendment) schedules its own migration: the legacy compound signal \"is
      itself owed migration to criteria per the kind-layer legacy map, executed
      for this strategy at its first bootstrap claim.\" Measured 2026-09-01: the
      strategy carries no criteria field and no such edit, and the P1 first
      bootstrap claim (tactic-intent-orchestration-layer-schema, status codified
      / phase implement) records the legacy-map vocabulary binding in its own
      drift-review clarification but touches no part of this strategy's
      success_signal. The map (intentions/kind-kind.md:287-320) is itself
      DEFERRED and Claude-drafted. CONSEQUENCE FOR THIS NODE'S PLAN: the
      registry binds no check to an unratified criterion — under the
      sanction-gated ratchet (gating promotion only for checks bound to ratified
      criteria, tactic-bootstrap-operation steering ledger [1]) a check with no
      ratified criterion stays observe-tier, and transcribed criteria enter
      DEFERRED until author ratification (strategy shim-set amendment, item 3).
      Incumbent gates are not affected: they were never promoted, and under this
      node's own governs-marker rule incumbent text governs a surface until its
      checks exist in the registry and ratchet. The pending migration is itself
      a member of the frontier this node derives, and surfaces there once the
      deriver is live rather than being executed inside this plan."
  - question: Drift review [2] - what is the measured state of the sibling schema
      surface, and what sequencing follows (2026-09-01)?
    answer: "(Recorded 2026-09-01 /align-tactics per-node drift review; on-disk
      state measured the same day in the tactic-migration-frontier-projection
      worktree.) SIBLING-SURFACE STATE AND SEQUENCING.
      tactic-intent-orchestration-layer-schema is plan-finalized but unbuilt
      (status codified, phase implement):
      packages/intentionsutil/scripts/write-class-census.ts and
      packages/intentionsutil/src/operational-records.ts do not exist, and
      packages/intentionsutil/scripts/check-durable-write-fence.ts carries no
      --writer-class flag. Its Unit 5 assigns the census's tier registration and
      high-water ratchet to this node (\"this unit produces the reading, not the
      registry\") and its Unit 6 out-of-scope list names \"the frontier deriver
      (tactic-migration-frontier-projection)\" — so the write-class census is a
      FUTURE first client of this registry, never a present dependency. Edge
      state: this node carries blocked_by: [] and is unblocked;
      tactic-ladder-reconciliation-observe blocks on all three P1 surface owners
      including this one; the execution ordering (finalize the three surface
      owners in order, then their execution claims) lives on
      tactic-bootstrap-operation, and per the strategy's own ruling the
      blocked_by edges win over the P0-P4 projection prose. The plan therefore
      registers checks that exist today (validate-graph passes, run-lint's check
      block, the .github/scripts decay sensors) and leaves a registration slot
      for the census, rather than assuming Unit 5/6 artifacts on disk. Also out
      of this node's scope and recorded elsewhere: the deferred-queue deriver
      (tactic-consolidation-operation) and the tactic-mainqa-* queue
      transcription (claimed by tactic-bootstrap-operation's P2 scope), even
      though shim 3's liquidation condition is this node's deriver going live."
  - question: Drift review [3] - may the high-water ratchet be stored as
      hand-maintained state (2026-09-01)?
    answer: "(Recorded 2026-09-01 /align-tactics per-node drift review.) HIGH-WATER
      RATCHET MUST BE DERIVED, NOT HAND-MAINTAINED. This node's body records the
      ratchet as \"observe -> gating once ever-passed-on-main,\" which reads as
      remembered state, while its rationale takes the IaC-reconciliation
      position that the bridge between current and desired state is derived at
      execution time and never stored, precisely to replace stored migration
      step-lists (the author's named regression source). The mechanics are
      author-delegated, so no ratification is owed; the constraint the plan must
      satisfy is that the high-water be recomputable from durable evidence —
      origin/main history, or an append-only observed-evidence record of the
      operational layer — never a hand-edited gating table a human keeps in
      sync. The same constraint applies to any grandfathering the registry
      needs: the repo already carries three distinct incumbent shapes (a JSON
      grandfather baseline in validate-graph's prose-ref and planlint's
      plan-body lists, diff-scoped net-new in check-type-safety-escapes.sh, and
      marker-only full-repo scans), and a fourth hand-maintained shape would
      reintroduce exactly the staleness this tactic exists to remove."
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Derive brownfield migration frontiers — observe-mode target rules whose reported frontier is the remaining migration, with drain-then-ratchet mechanics and deprecation as migration-to-absence

## Context

This node owns the **check/criteria registry, the sanction-gated high-water
ratchet, the reconciliation-frontier deriver, basis pins with the stale-intent
frontier, and the shim inventory**. It is position **P1** on the bootstrap
critical path recorded on `strategy-graph-native-dispatch`
(execution-authority clarification, 2026-09-01, frozen-queue ruling), claimed
by `tactic-bootstrap-operation` (phase `implement`, `pace_exempt: true`).
`tactic-intent-orchestration-layer-schema` finalized first; this node finalizes
second; `tactic-consolidation-operation` third.

**The problem.** Migration state is stored today, so it stales. A stored
migration step-list is a hand-maintained projection of the difference between
where the repo is and where the author wants it — and the author named that
regression source directly. The IaC reconciliation loop (Terraform `plan`;
Kubernetes level-triggered controllers) resolves it by never storing the
bridge: current state and desired state are both read, and the delta is derived
at execution time, so it cannot be wrong about the past. Applied here: **the
reported frontier IS the remaining migration**, recomputed on every read.

**Why this widened beyond migrations.** The 2026-09-01 ladder-reconciliation
ruling unified implementation and migration — both are reconciliation — so the
frontier absorbs the derived gap: **unsatisfied criteria ARE the backlog**.
Check tiers plus the high-water ratchet (observe → gating once ever-passed on
main) are the mechanized four-step migration contract. The observe tier is a
*declared* tier with a promotion rule, never a skipped test. The author's
machine-signal maximization directive (2026-09-01) makes the check
expressiveness ladder (example → property-based → invariant) this node's growth
axis, jointly with `tactic-kind-schema-blocks`.

**Deprecation is a migration whose target is absence.** The frontier reports
remaining live references; the ratchet is deletion plus a lint refusing new
ones. The concrete first table is the **dangling-tooling-path frontier**,
re-measured on this worktree 2026-09-01 (superseding the 2026-08-31 figures
carried in the pre-finalize body, which gave no counts):

- `dispatch-token-audit` → `rsi-audit`: **34 files** under `intentions/` +
  `.claude/` still name `dispatch-token-audit`; `.claude/skills/rsi-audit/`
  exists, `.claude/skills/dispatch-token-audit/` does not. This includes
  `strategy-token-economy`'s own sensor path.
- `align-init`: **39 files** still name it; `.claude/skills/align-init/` does
  not exist.
- `packages/intentionsutil/scripts/boost-node.ts` and its siblings
  (`boost-node`, `test-boost-node.sh`) are **absent from disk** while
  `intentions/tactic-attention-boost-scripts.md` reads `status: codified`,
  `phase: done` and its Units 2–3 name them as deliverables
  (`:246-262`, `:333-338`).

The incumbent `lint-verify-fence-paths.sh` cannot see any of this: it scans
only ` ```verify ` fences and **never scans `done` nodes** (its header states
this — done bodies are archives by design). So this class needs its own
registered check, and the boost case needs the frontier's *prose-gap* arm
because "a done node whose deliverable is absent" is not mechanically separable
from a legitimate historical citation. Natural rendering home for the table:
the graph digest's derived check tables (`packages/intentionsutil/src/digest.ts:412`,
`renderTables`), charter `tactic-rsi-graph-review`.

**Bootstrap folds this finalize absorbs** (author-directed at initiation):

1. **Sanction-gated ratchet.** High-water promotion to gating applies **only**
   to a check bound to a **ratified** criterion. A check bound to a deferred or
   executor-derived criterion stays observe-tier regardless of pass history.
   Executor-derived criteria enter the registry **deferred** until author
   ratification. This closes the leak the 2026-09-01 adversarial review found:
   a finding outside every sanctioned criterion must never acquire gating force
   through the ratchet.
2. **Implicit-criteria transcription is bootstrap shim 4.** Transcribing the
   criteria implicit in incumbent checks (CI checks, `validateGraph` rules,
   lint sensors) into the registry liquidates that shim. Transcribed criteria
   enter **deferred**.
3. **The writeNode-declaration ratchet flip is this node's surface.**
   `tactic-intent-orchestration-layer-schema`'s Unit 5 census
   (`write-class-census.ts`) is a first registry client — it produces the
   reading; registering it with a tier and flipping it to gating is here. That
   node's Unit 6 out-of-scope list assigns the frontier deriver here, and
   `tactic-bootstrap-operation` completion criterion 1 (the P4
   dispatch-resumption gate) requires that deriver **live**.
4. **The intent-layer reconciliation criterion** (`strategy-graph-integrity`,
   2026-09-01, ratified): an amendment to ratified content derives a
   **stale-intent frontier** — every disposition, citation, or authority
   reference whose recorded basis rests on the amended text. Mechanism and
   first instance are delegated here with **no first-instance review owed**;
   derivation is read-only, folding into this owned surface with no new carrier
   (carrier exception on `strategy-graph-native-dispatch`).
5. **Governs-marker derivation.** A surface is target-governed once its checks
   exist in the registry and ratchet; until then incumbent text governs.
   Hand-written transition notes are the interim form and liquidate here.
6. **The shim inventory.** Live shims with liquidation conditions (shim
   principle, 2026-09-01). A liquidation-overdue shim surfaces as a frontier
   item, and the live-shim count is a cheap machine signal for the observe loop.

**Explicitly NOT absorbed.** The deferred-decision queue deriver
(interim surface `grep -rn "decision: deferred" intentions/`, currently
**15 files**) is `tactic-consolidation-operation`'s surface. Evidence folding,
unmatched-evidence detection, and one-ruling-one-stamp normalization are also
that node's. `tactic-ladder-reconciliation-observe` **integrates** this surface
via a `blocked_by` edge and does not rebuild it.

**No data-viz unit.** Every surface here renders as deterministic monospace
text (frontier report, digest check table, JSON for tooling). Nothing in this
plan is a chart, plot, or dashboard, so `/dataviz` does not apply.

## Design

### Greenfield design

One derived set, computed at read time from (target state, operational state),
stored nowhere:

```
frontier = unsatisfied-criteria
         ∪ failing-observe-checks
         ∪ stale-intent-items
         ∪ liquidation-overdue-shims
```

**Criteria are intent-layer data, and they are dispositions.** A criterion is
`{id, statement, class, authority, recorded}` where `class` is
`functional | non-functional` and `authority` is
`ratified | delegated | deferred`. Sanction *is* ratification; there is no
separate "proposed" state. Functional criteria live in `attributes.criteria` on
the strategy whose target state they express. The **standing non-functional
set** (security, type-safety, test-integrity, style, token-economy) is recorded
**once** on `intentions/kind-strategy.md` as `attributes.standing_criteria` and
**projected onto every strategy at read time** — never copied. A
standing-criterion change therefore propagates mechanically (level-triggered)
and expires every assessment whose pin includes the standing-criteria
fingerprint.

**Checks are code, and tier is derived, never stored.** A check is a declared
`{id, criterion, describe, run}` in a code-side registry. Its tier is a pure
function of two inputs:

```
tier(check) = "gating"  iff criterionAuthority(check.criterion) === "ratified"
                       AND highWater.has(check.id)
            = "observe" otherwise
```

Monotonicity is structural: `highWater` is an append-only set of "this check
passed on main" evidence records, and the store has no delete primitive, so a
promotion cannot be un-promoted by a later write. Demotion happens only by the
criterion's authority moving — which is an author act, not a mechanical one.

**Basis pins.** A pin is `{cites, hash, pinned_at}` in `attributes.basis_pins`
on the *citing* node, where `hash` is a sha256 over the canonical JSON of the
cited disposition's substance — the same recipe shape as
`strategyFingerprint` (`router.ts:103`) and `tacticScopeFingerprint`
(`router.ts:132`), not a new hashing scheme. The stale-intent frontier is the
set of pins whose recomputed hash differs from the stored one.

**Shims.** `attributes.shims` on the declaring node:
`{id, target, liquidation, liquidated_by, declared}`. `liquidated_by` names a
check id or criterion id when the condition is machine-expressible; a shim is
**overdue** when its `liquidated_by` is satisfied (check gating and passing, or
criterion satisfied) while the shim is still declared.

**Rendering.** One pure deriver, one deterministic text renderer, one `--json`
mode, one CLI that always exits 0 — it is a sensor, not a gate, exactly as
`grounding-gap.ts` is — plus one digest check table. Gating force lives in a
separate runner, so reading the frontier can never fail a build.

### Brownfield path

The greenfield state cannot land in one step, and the four-step migration
contract is precisely what the units stage — the contract mechanizing itself is
the point:

1. **Record target** — the criteria model and the check registry with derived
   tiers (units 1–2).
2. **Read-tolerance window** — everything runs observe-only. No check can gate
   until its criterion is ratified *and* the high-water mark exists, so landing
   the registry cannot turn `main` red (unit 2).
3. **Drain** — the derived frontier IS the remaining migration: unregistered
   incumbent checks, undeclared shims, unpinned intra-graph citations, dangling
   tooling paths (units 3–7). Draining is registering, declaring, pinning,
   deleting.
4. **Ratchet** — sanction-gated high-water promotion, one-way (unit 2), with
   the gating runner wired into CI (unit 7).

## Units of work

### Unit 1 — The criteria model and the standing-criteria home

**Scope.**

New file `packages/intentionsutil/src/criteria.ts`, pure over
`IntentionNode[]`, no fs and no process:

- `CriterionClass = "functional" | "non-functional"` and
  `CriterionAuthority = "ratified" | "delegated" | "deferred"`.
- `interface Criterion { id, statement, class, authority, recorded }` —
  `recorded` is `YYYY-MM-DD`.
- `parseCriteria(node): Criterion[]` — reads `attributes.criteria`, an array of
  plain objects. Unknown keys are **rejected**, not ignored, so a smuggled
  field cannot ride along (same rule as the schema tactic's `claim.v1` /
  `evidence.v1` validators). Throws `IntentionSchemaError`
  (`packages/intentionsutil/src/errors.ts`) naming the offending field.
  Absence of the key yields `[]`; a malformed value throws — a clear error, not
  a fallback (`.claude/rules/code-style.md`).
- `standingCriteria(nodes): Criterion[]` — reads `attributes.standing_criteria`
  off the `kind-strategy` node found in `nodes`. Throws if that node is absent
  from the passed array rather than returning `[]`: an empty standing set read
  from a truncated node list would silently disarm every non-functional check.
  Every entry must have `class === "non-functional"`; a `functional` entry in
  the standing home throws.
- `effectiveCriteria(strategy, nodes): Criterion[]` — **the projection**: the
  strategy's own `parseCriteria` union `standingCriteria(nodes)`, id-sorted,
  with a duplicate id across the two sources throwing rather than silently
  shadowing. This function is the single home of the "derived onto every
  touched strategy on read, never a stored copy" rule; no caller may
  re-implement it (single-callsite doctrine, as `strategyAlignSelectable`
  models at `router.ts:661`).
- `criteriaFingerprint(criteria): string` — sha256 over canonical JSON of the
  id-sorted criteria, for assessment pins. Copy the recipe **shape** from
  `strategyFingerprint` (`packages/intentionsutil/src/router.ts:103`); do not
  invent a second hashing convention.

Data edits:

- `intentions/kind-strategy.md` — add `attributes.standing_criteria` beside the
  existing keys (the `attributes:` block starts at
  `intentions/kind-strategy.md:94`; `goal_layer`, `fields`, `edges`,
  `status_vocabulary` are already there). Seed it with the five standing
  non-functional criteria the ratified class axis names — security,
  type-safety, test-integrity, style, token-economy — each `authority:
  deferred`, because a Claude-transcribed criterion enters deferred until
  author ratification. Add a `fields:` entry documenting the key, matching the
  file's existing documentation convention.
- `intentions/kind-kind.md` — add a `fields:` entry documenting
  `attributes.criteria` as valid on any goal-layer node.

Validation:

- In `packages/intentionsutil/src/schema.ts`, add a presence-conditional
  `validateGraph` rule (numbered after the current highest; rule 23 is the
  `attributes` shadow-ban at `:1532`, and the numbering comment at `:1966`
  explains the convention) asserting the shape of `attributes.criteria` and
  `attributes.standing_criteria` wherever present. A node with neither key is
  unaffected, so this cannot retroactively break `main`. Register it in
  `validateGraph` (`:2028`) alongside the existing per-node rules.

Tests: new `packages/intentionsutil/test/criteria.test.ts` covering parse
success, unknown-key rejection, missing-`kind-strategy` throw, the
functional-in-standing-home throw, duplicate-id throw, projection ordering, and
fingerprint stability under key reordering. Extend
`packages/intentionsutil/test/schema.test.ts` for the new rule.

**Out of scope.** Any check registry. Any tier. Any frontier. Recording
functional criteria on any strategy node (unit 6 does the transcription).
Ratifying anything.

**Recommended model:** opus.

### Unit 2 — The check registry, the derived tier, and the sanction-gated high-water ratchet

**Scope.**

New file `packages/intentionsutil/src/checks.ts`:

- `interface CheckDeclaration { id, criterion, describe, run }` where `run` is
  `(ctx) => CheckResult` and `CheckResult` is
  `{ ok: boolean, detail: string, entries: FrontierEntrySeed[] }` — a check
  reports both a verdict and the individual frontier items behind it, so an
  observe-tier failure is a *list of remaining work*, not a bare red.
- `class CheckRegistry` with `register` / `names` / `resolve`, mirroring
  `SensorRegistry` (`packages/intentionsutil/src/sensors.ts:26-58`)
  **line-for-line in surface**: `names()` returns a `ReadonlySet<string>`
  snapshot, and `resolve()` throws `IntentionSchemaError` naming the missing id
  and listing every registered id — no silent skip, no fallback.
- `type CheckTier = "observe" | "gating"`.
- `deriveTier(check, criteriaById, highWater): CheckTier` — the pure rule
  stated in the Design section. **Both conjuncts are required.** A check whose
  criterion id resolves to nothing throws rather than defaulting to observe:
  an unbound check is a registry defect, and defaulting would hide it. This
  function is the single home of the sanction gate; no caller re-derives it.
- `interface HighWaterSource { has(checkId: string): boolean }` — the seam.
  `deriveTier` takes the interface, never a concrete store, so the pure tier
  rule is testable with a fake and the persistence choice stays swappable.
- `promotionRecord(checkId, sha): EvidenceSeed` — builds the append payload
  recording "this check passed on main at `<sha>`", shaped to the
  `evidence.v1` tuple `{finding, criterion-or-gap, disposition, claim/PR, date,
  recurrence key}`.

New file `packages/intentionsutil/src/high-water.ts` — the concrete
`HighWaterSource` over the append-only operational store: reads the ever-passed
records and exposes `has`. It calls
`packages/intentionsutil/src/operational-store.ts`'s `appendEvidence` /
read helpers, delivered by `tactic-intent-orchestration-layer-schema`'s Unit 6.

> **Cross-node dependency, stated so a clean session does not guess.**
> `operational-store.ts` and `operational-records.ts` **do not exist on disk
> today** — that node is `phase: implement` (plan finalized, code not built),
> confirmed by direct file check. Its Unit 6 is the producer. If those modules
> are absent when this unit is claimed, implement `high-water.ts` against the
> `HighWaterSource` interface with a **create-only, one-file-per-record**
> reader/writer under `intentions/operational/high-water/<check-id>/<sha>.json`
> following that plan's stated layout rules verbatim (one file per record,
> created and never edited; identical content at the same path is an idempotent
> no-op; a differing payload at the same path throws), and leave a
> `TODO(tactic-intent-orchestration-layer-schema)` naming the swap. Do **not**
> invent a shared mutable ledger file — a shared hot file is exactly what the
> ratified layout forbids, because per-record files make concurrent appends
> commutative and conflict-free by construction.

Tests: new `packages/intentionsutil/test/checks.test.ts` — registry
register/resolve/throw parity with `sensors.test.ts`; and the tier matrix
exhaustively: ratified+highwater → gating; ratified+no-highwater → observe;
delegated+highwater → **observe**; deferred+highwater → **observe**; unbound
criterion → throw. The three non-`ratified` rows are the sanction gate and must
be asserted individually, not as one grouped case.

**Out of scope.** Registering any concrete check (units 6–7). Running checks.
Any CI wiring. Any node data edit.

**Dependencies.** Unit 1.

**Recommended model:** opus.

### Unit 3 — The reconciliation-frontier deriver, its CLI, and the digest table

**Scope.**

New file `packages/intentionsutil/src/frontier-reconciliation.ts`:

- `interface FrontierEntry { kind, id, subject, detail, criterion, authority }`
  where `kind` is
  `"unsatisfied-criterion" | "observe-failure" | "stale-intent" | "overdue-shim" | "prose-gap"`.
- `deriveReconciliationFrontier(input): FrontierEntry[]` — id-sorted, total,
  pure. This unit lands the first two arms (unsatisfied criteria; failing
  observe-tier checks). Units 4, 5 and 7 append the `stale-intent`,
  `overdue-shim` and `prose-gap` arms **through the same entry type**, so the
  render, the CLI and the digest table need no change when they land.
- `renderReconciliationFrontier(entries): string` — deterministic; conditional
  segments emitted only when non-empty, so an empty frontier renders a stable
  single summary line, following `renderFrontier`'s per-goal marker discipline
  (`packages/intentionsutil/src/goals.ts:177`).

> **Naming, deliberately non-colliding.** `frontier` already carries three
> senses in this repo: the goal-layer active frontier (`activeFrontier`,
> `packages/intentionsutil/src/goals.ts:72`; rendered by
> `packages/intentionsutil/scripts/frontier-view.ts`), the review-coverage
> frontier entry (`frontierEntryFor`,
> `packages/intentionsutil/src/coverage.ts`), and a local BFS variable in
> `grounding.ts`. `intentions/kind-kind.md:287-320` flags the collision
> explicitly as owed disambiguation. So every symbol this unit adds carries the
> `Reconciliation` qualifier, and no existing `frontier` symbol is renamed —
> renaming would be a migration this node has not sanctioned.

New CLI `packages/intentionsutil/scripts/reconciliation-frontier.ts`, modeled
on `packages/intentionsutil/scripts/grounding-gap.ts` line-for-line: `listNodes`
→ derive → `renderHuman` or `--json`, **always exits 0**. Header documents
usage as `node --import tsx/esm packages/intentionsutil/scripts/reconciliation-frontier.ts [intentionsDir] [--json]`
— never `npx tsx`, which dies with `listen EPERM` under the sandbox before it
parses arguments (`.claude/rules/sandbox.md`).

Digest table: add `tableReconciliationFrontier` to
`packages/intentionsutil/src/digest.ts` and append it to `renderTables`'s fixed
list (`:412-425`, after `tableStoredDefaults`). Route every id through the
existing `renderId` escape helper (`digest.ts:57`) — the digest is the
first-read surface fed to the `/align-audit` LLM auditor and an un-escaped id
can forge table lines. This is the "natural home: a digest check table"
recorded in the pre-finalize body; charter `tactic-rsi-graph-review`.

Tests: new `packages/intentionsutil/test/frontier-reconciliation.test.ts`
(both arms, empty-frontier byte stability, id-sort determinism); extend
`packages/intentionsutil/test/digest.test.ts` for the new table.

**Out of scope.** Gating anything. The stale-intent arm (unit 4). The shim arm
(unit 5). Renaming any existing `frontier` symbol.

**Dependencies.** Units 1 and 2.

**Recommended model:** opus.

### Unit 4 — Basis pins on intra-graph citations and the stale-intent frontier

**Scope.**

New file `packages/intentionsutil/src/basis-pins.ts`:

- `interface BasisPin { cites, hash, pinned_at }`, read from
  `attributes.basis_pins` on the citing node, with the same unknown-key
  rejection as unit 1.
- `dispositionHash(node, dispositionId): string` — sha256 over canonical JSON
  of the cited disposition's substance. Reuse the recipe shape from
  `strategyFingerprint` (`packages/intentionsutil/src/router.ts:103`), which
  hashes an explicit field allowlist so state-only writes never move the hash.
  Do not hash the whole node: a `phase` transition must not invalidate an
  intent citation.
- `deriveStaleIntent(nodes): FrontierEntry[]` — for every pin, recompute and
  compare; a mismatch is a `stale-intent` entry naming the citing node, the
  cited disposition, and both hashes. A pin whose `cites` target does not
  resolve is **also** an entry (a dangling citation is a stale-intent item, not
  a silent skip). Derivation is **read-only**: this module never writes a pin,
  mirroring `grounding.ts`'s stated "never WRITES marks" contract.
- Wire the arm into `deriveReconciliationFrontier` (unit 3).

Data: add a `fields:` entry to `intentions/kind-kind.md` documenting
`attributes.basis_pins`, and extend unit 1's `validateGraph` rule to cover its
shape where present.

**Do not build a pin *writer* here.** Pinning at authoring time belongs to the
align skill family and is not sanctioned by this node's scope; deriving the
frontier from whatever pins exist is. An empty pin corpus yields an empty arm,
which is the honest reading during bootstrap.

Cite `.claude/skills/ref-diagnosis-time-cas/SKILL.md` in the module header as
the existing statement of this rule by shape ("any caller that decides from a
read and later writes that node must pin the blob at the deciding read") —
extend it, do not re-derive it.

Tests: new `packages/intentionsutil/test/basis-pins.test.ts` — matching hash
yields no entry; amended cited text yields an entry; a state-only write to the
cited node yields **no** entry (the allowlist property); dangling `cites`
yields an entry.

**Out of scope.** Writing pins. Any change to `strategyFingerprint` or
`tacticScopeFingerprint`. Any change to the existing scope-stamp files or
`restamp-scope-fingerprint.ts`.

**Dependencies.** Unit 3.

**Recommended model:** opus.

### Unit 5 — The shim inventory and the retroactive shim declarations

**Scope.**

New file `packages/intentionsutil/src/shims.ts`:

- `interface ShimDeclaration { id, target, liquidation, liquidated_by, declared }`
  read from `attributes.shims`, unknown keys rejected.
- `deriveShimFrontier(nodes, tiers, criteria): FrontierEntry[]` — one
  `overdue-shim` entry per shim whose `liquidated_by` resolves to a check that
  is gating **and** passing, or to a satisfied criterion, while the shim is
  still declared. A shim whose `liquidated_by` is `null` (condition not
  machine-expressible) is **live, not overdue** — it still counts toward the
  live-shim total.
- `liveShimCount(nodes): number` — the cheap machine signal for the observe
  loop, exported for the digest table and for any sensor that wants it.
- Wire the arm into `deriveReconciliationFrontier` (unit 3).

Data edits — retroactive declarations, executed at this claim per the shim
principle's delegated practice mechanics. Add `attributes.shims` recording the
already-declared shims, each already carrying its target element and
liquidation condition in prose on the source node, so this is transcription,
not new intent:

- `intentions/strategy-graph-native-dispatch.md` — the five review/qa/main-qa
  reconciliation shims (review, qa, main-qa, implicit-criteria, finding-ledger)
  from the "What bootstrap shims implement the review/qa/main-qa reconciliation
  doctrine" clarification, plus the refinement-annotation shim declared in the
  shim-principle clarification, plus the P0–P4 prose transition-note shim
  declared in the execution-authority clarification's projection-mark amendment.
- `intentions/tactic-bootstrap-operation.md` — the carrier shim it already
  declares in its own "## Shim declaration" section.
- `intentions/tactic-intent-orchestration-layer-schema.md` — its
  `write_class_shims` for the three `shared` fields, cross-referenced rather
  than duplicated.

Set `liquidated_by` only where the condition is genuinely machine-expressible
today; otherwise `null` with the prose condition preserved verbatim in
`liquidation`. Do not paraphrase a liquidation condition — the prose is the
author's.

Also fold in **governs-marker derivation**: a `governs` accessor reporting, per
surface, whether target checks exist in the registry and ratchet (→
target-governed) or not (→ incumbent text governs). Hand-written transition
notes are the interim form and are recorded as shims here, which is their
liquidation path.

Data: `fields:` entry in `intentions/kind-kind.md` for `attributes.shims`;
extend unit 1's `validateGraph` rule to its shape.

Tests: new `packages/intentionsutil/test/shims.test.ts` — overdue detection,
the `liquidated_by: null` live-not-overdue case, count correctness.

**Out of scope.** Liquidating any shim. Any edit to a shim's prose liquidation
condition. `tactic-consolidation-operation`'s folding machinery.

**Dependencies.** Unit 3.

**Recommended model:** sonnet.

### Unit 6 — Implicit-criteria transcription (bootstrap shim 4) and the registration census

**Scope.**

Transcribe the criteria implicit in the incumbent check corpus into the
registry. Every transcribed criterion enters `authority: deferred` — a
Claude-transcribed criterion is a disposition held for author ratification, and
under unit 2's tier rule a deferred criterion's check can never gate. The
corpus, enumerated from disk on this worktree 2026-09-01:

- `.github/scripts/`: `check-firestore-query-bounds.sh`,
  `check-graph-fast-path.sh`, `check-playwright-version-sync.sh`,
  `check-test-integrity.sh`, `check-type-safety-escapes.sh` (5 checkers; the
  `test-check-*.sh` siblings are their harnesses, not checks).
- `.claude/skills/dispatch-propagate/scripts/`: `lint-ds-drift.sh`,
  `lint-prose-rules.sh`, `lint-vendored-skills.sh`,
  `lint-verify-fence-paths.sh`.
- `packages/intentionsutil/scripts/validate-graph.ts` — its passes:
  `validateGraph` frontmatter rules, `lintTacticBodies`,
  `validateGraphProseRefs`, and the `--strict-sensors` sensor-registration
  pass.
- `packages/intentionsutil/scripts/write-class-census.ts` — the writeNode
  declaration census (fold 3 above). Register it; its criterion is the
  layer-boundary criterion owned by
  `tactic-intent-orchestration-layer-schema`, so this unit **binds** to that
  criterion rather than minting a rival one.

Record the transcribed criteria as `attributes.criteria` on the strategies
whose target state they express, and register each check in a new
`packages/intentionsutil/src/check-registrations.ts` — the concrete wiring-up
call site, mirroring `read-sensors.ts`'s `registeredSensorNames()` shape so the
registry's membership is derivable from the registry itself rather than
duplicated by hand.

Add `packages/intentionsutil/scripts/check-registration-census.ts` — a
read-only observe-tier census reporting every incumbent check script on disk
that is **not** registered, and every registered check whose criterion is not
recorded. **Always exits 0.** This census is the drain gauge for this unit's
own migration: it empties as registration proceeds. Header documents
`node --import tsx/esm` usage.

Note in the module header that `.github/scripts/check-test-integrity.sh`
deliberately carries **no** `<sensor>-ok:` suppression marker (its own header
says so, and `.claude/rules/test-integrity.md` forbids any self-serve escape).
The registry must therefore support a check declaring "no suppression", not
assume uniform marker support.

Tests: new `packages/intentionsutil/test/check-registrations.test.ts` — every
registered check resolves a recorded criterion (the same forward-direction rule
`validate-graph.ts`'s sensor pass applies, and fatal here in the package's own
CI for the same reason that rule is fatal in `lifecycle-sensor.test.ts`).

**Out of scope.** Ratifying any transcribed criterion. Promoting any check.
Changing any incumbent check's behavior. Deleting or rewriting
`run-lint.sh`'s existing if-blocks (unit 7 adds beside them; the table-driven
replacement of that if-chain is a later frontier item, not this bite).

**Dependencies.** Units 2 and 3.

**Recommended model:** sonnet.

### Unit 7 — The tier-aware runner, CI wiring, and the dangling-tooling-path deprecation check

**Scope.**

1. New `packages/intentionsutil/scripts/run-registered-checks.ts` — runs every
   registered check, prints one `tier verdict id — detail` line each, and exits
   non-zero **only** when a **gating**-tier check fails. An observe-tier failure
   prints and never blocks; that is the doctrine ("observe-tier failures never
   block"), and it is also what makes landing this safe: with every criterion
   deferred at unit 6, the runner is green on day one by construction. Header
   documents `node --import tsx/esm` usage.

   The two-posture precedent to follow is `validate-graph.ts`'s
   `--strict-sensors` (`:193-269`): **same rule, same code, two enforcement
   postures selected explicitly** — not two implementations. Read that block's
   comment before writing this: it records the 2026-08-14 outage where denying
   the write path over a registry defect blocked every writer in the repo.

2. Wire it into `.claude/skills/dispatch-propagate/scripts/run-lint.sh`
   **unconditionally**, as a new block beside the three existing unconditional
   blocks (`verify-fence-paths`, `vendored-skills`, `type-safety-escapes`, at
   `run-lint.sh:104-236`), appending to the same `FAILURES` array in the same
   shape. Not gated on changed files: the tier derivation reads the graph, and
   a changed-files gate would skip exactly the criterion-authority changes that
   move a tier.

3. New check `dangling-tooling-path`, registered per unit 6 — the deprecation
   arm, "a migration whose target is absence". Over `.claude/**` prose and
   **non-`done`** intention node bodies, every path-like token whose first
   segment is one of the tooling roots (`packages/intentionsutil/scripts/`,
   `.claude/skills/`, `.claude/hooks/`, `.github/scripts/`) must exist on disk.
   **Reuse `lint-verify-fence-paths.sh`'s token rule verbatim** — contains `/`;
   contains none of `$ * ? { } ( )`; not a URL; trailing `:<line>` anchor
   stripped; and, critically, its **orphan-vs-forward-reference** rule: a
   missing path is reported only if git history shows it once existed, because
   plans legitimately name files their own unit will create. Companion check
   `stale-skill-reference`: every `/skill-name` citation resolves to an existing
   `.claude/skills/<name>/`.

   Expected initial reading, measured on this worktree 2026-09-01 (a
   **measurement**, and the drain target): 34 files naming
   `dispatch-token-audit` (skill absent; `.claude/skills/rsi-audit/` is the
   successor), 39 naming `align-init` (skill absent).

4. Record as a **prose-gap** frontier entry (not a check) the
   `tactic-attention-boost-scripts` case: `status: codified`, `phase: done`,
   Units 2–3 name `packages/intentionsutil/scripts/boost-node.ts`,
   `scripts/boost-node`, `scripts/test-boost-node.sh`, and none exists on disk.
   It is a prose gap deliberately, because the `done`-node exclusion is
   load-bearing (done bodies are archives that may legitimately name gone
   paths) and no mechanical rule separates "absent deliverable" from
   "historical citation". Under the ratified anti-starvation rule this entry
   carries recurrence/impact and is elevated into a future bite by rank — it is
   **never** fixed by widening this claim.

   Mechanism (validation-pass amendment, 2026-09-01): the `prose-gap` arm is
   the deriver's fifth arm and lands in **this unit**, through the same
   `FrontierEntry` type units 4–5 use. Its recorded input is a create-only
   gap-note record under `intentions/operational/gap-notes/<note-id>.json` —
   the same one-file-per-record, created-never-edited layout as unit 2's
   high-water fallback — holding `{subject, detail, recorded_at, disposed_by}`;
   the arm emits one `prose-gap` entry per record whose `disposed_by` is null.
   This unit creates the boost-scripts case as the first such record. No node
   frontmatter change and no new baseline JSON: the note store is data the
   deriver reads, never a hand-edited gating surface.

Tests: extend `packages/intentionsutil/test/checks.test.ts` for the runner's
exit-code contract (gating fail → non-zero; observe fail → zero; no checks →
zero with an explicit "0 checks registered" line, never a silent vacuous pass —
the `CHECKED == 0` discipline `run-typecheck.sh:287-293` already models). New
tests for the two path checks including a forward-reference case that must not
be flagged.

**Out of scope.** Promoting any check to gating. Deleting any dangling
reference (that is the drain, a separate claim). Replacing `run-lint.sh`'s
if-chain with a table.

**Dependencies.** Units 2, 3 and 6.

**Recommended model:** sonnet.

## Reuse

- `packages/intentionsutil/src/sensors.ts:26-58` — `class SensorRegistry`
  (`register` / `names` / `resolve`, throwing `IntentionSchemaError` listing
  every registered name). Unit 2's `CheckRegistry` copies this surface exactly;
  `packages/intentionsutil/scripts/read-sensors.ts`'s `registeredSensorNames()`
  is the wiring-up call site unit 6 mirrors.
- `packages/intentionsutil/src/sensors.ts:241` — `deriveGap`, the canonical
  "mechanical gap derivation, never stored" total rule, and the compositional
  pattern of filtering by a derived predicate instead of reading a stored field.
- `packages/intentionsutil/src/grounding.ts:245` — `analyzeGrounding`, the
  closest existing precedent overall: a read-time census with a
  marked/unmarked partition where **absence is the frontier**, ranked remaining
  work, and an explicit "never WRITES marks" header contract. Units 4–5 copy
  its read-only discipline.
- `packages/intentionsutil/scripts/grounding-gap.ts` — the sensor-CLI skeleton
  (`listNodes` → analyze → `renderHuman` / `--json`, always exit 0). Unit 3's
  CLI follows it.
- `packages/intentionsutil/src/goals.ts:72` `activeFrontier`, `:111`
  `projectGoals`, `:177` `renderFrontier`, and
  `packages/intentionsutil/scripts/frontier-view.ts` — the existing
  frontier-projection idiom: pure projection + thin deterministic renderer +
  script entrypoint that only wires them. Reuse the **shape**; do not rename or
  repurpose these symbols (see unit 3's naming note).
- `packages/intentionsutil/scripts/validate-graph.ts:193-269` — the
  `--strict-sensors` observe→gating precedent: one rule, two postures selected
  by an explicit flag/call-site, with the 2026-08-14 outage recorded as the
  reason gating is scoped. Unit 7's runner follows it.
- `packages/intentionsutil/scripts/validate-graph.ts:32-37,105-112` —
  `loadBaseline` / `prose-ref-baseline.json`, and
  `packages/intentionsutil/src/planlint.ts:25-137` —
  `loadPlanBodyBaseline` / `plan-body-baseline.json`. Two near-identical
  grandfather-baseline mechanisms with no shared abstraction, both documented
  as "should NOT grow going forward". This plan deliberately adds **no third
  baseline JSON**: the derived frontier plus the sanction-gated tier is the
  generalization those two are a special case of, which is the parsimony
  argument for the registry.
- `packages/intentionsutil/scripts/graph-census-debt.ts:150` `computeDebt`,
  `:350` `decideCensus` — the existing drain-then-ratchet mechanism: derive
  violation-id sets fresh every call, union to a total, latch a threshold
  crossing exactly once. Unit 3's arm-union follows the derive-fresh half.
- `packages/intentionsutil/src/census.ts:13` `classifyTactic`, `:26`
  `strategyBacklogBand` — fs-free, process-free pure classifiers with a
  backlog/total/pct aggregate, explicitly built so consumers reuse the rules
  without shelling out. Use `strategyBacklogBand` if a percent-remaining
  figure is wanted; do not recompute one.
- `packages/intentionsutil/src/router.ts:103` `strategyFingerprint` and `:132`
  `tacticScopeFingerprint` — canonical-JSON-then-sha256 over an explicit field
  allowlist, so state-only writes never move the hash. Units 1 and 4 copy the
  recipe shape.
  `packages/intentionsutil/scripts/strategy-fingerprint.ts` is the precedent
  for exposing such a recipe as one canonical CLI so producers never
  hand-compute it.
- `packages/intentionsutil/src/transitions.ts:485-524` — `ScopeStamp`,
  `parseScopeStamp`, `isScopeStale`, `stampHash`. Note the caller-owns-policy
  contract: a `null` stamp is **not** stale, and the caller applies fail-open
  or fail-closed. Unit 4's deriver reports; it does not decide policy.
- `packages/intentionsutil/scripts/compute-freshness.ts` — computes against a
  pinned snapshot and returns booleans for a wrapper to act on. The same
  separation unit 3 keeps between the deriver (exit 0) and the runner (exit
  code).
- `packages/intentionsutil/scripts/dump-node.ts` — the content-addressed
  base-manifest capture (`<id>=<blobsha>` lines, merged not truncated), and
  `packages/intentionsutil/scripts/lib-base-pin.sh` — the shared
  `--base <blobsha>|<id>=<blobsha>|<manifest-file>` resolver. Any future
  frontier-pin consumer uses these rather than re-parsing manifest lines.
- `.claude/skills/ref-diagnosis-time-cas/SKILL.md` — the general rule by shape
  behind unit 4's basis pins; extend it, do not re-derive it.
- `packages/intentionsutil/src/schema.ts:321` `FIRST_CLASS_FIELD_PROBE` and
  `:352` `FIRST_CLASS_FIELD_NAMES`; `packages/intentionsutil/src/node-merge.ts:92`
  `MERGE_FIELD_COVERAGE_PROBE` — the `Record<keyof IntentionNode, …>`
  compile-time exhaustiveness idiom, already established twice, for any
  per-field map this plan adds.
- `packages/intentionsutil/src/schema.ts:1532` (rule 23, the `attributes`
  shadow-ban) and `:1966` (the rule-numbering comment) — where unit 1's new
  rule slots in. `criteria`, `standing_criteria`, `basis_pins` and `shims` are
  not first-class field names, so none of them trips the shadow-ban.
- `packages/intentionsutil/src/node-merge.ts:103` — `eq`, order-independent
  structural equality; the correct comparator anywhere this plan compares
  parsed attribute values (`JSON.stringify` false-differs on a YAML key
  reorder).
- `packages/intentionsutil/src/digest.ts:412` `renderTables` and `:57`
  `renderId` — unit 3's table slots into the fixed list, and every id goes
  through the escape helper.
- `.claude/skills/dispatch-propagate/scripts/lint-verify-fence-paths.sh` — the
  token rule and the orphan-vs-forward-reference rule unit 7 reuses verbatim,
  plus the `done`-nodes-are-archives exclusion that is precisely why unit 7's
  item 4 is a prose gap.
- `.claude/skills/dispatch-propagate/scripts/run-lint.sh:104-236` — the
  `FAILURES+=(…)` block shape unit 7 appends to, and the three existing
  unconditional blocks whose comments explain why each is ungated.
- `.claude/skills/dispatch-propagate/scripts/run-typecheck.sh:287-293` — the
  `CHECKED == 0` discipline: "verified nothing" is never reported as a pass.
  Unit 7's runner copies it.
- `.github/scripts/check-type-safety-escapes.sh` and
  `.claude/rules/type-safety-suppression-marker.md` — the
  `// <sensor>-ok: <reason>` same-line, non-empty-reason marker family. Reuse
  this shape if a registered check needs per-site suppression; never invent a
  new marker convention.
- `.github/scripts/check-test-integrity.sh` — the deliberate **absence** of a
  suppression marker, and `.claude/rules/test-integrity.md` for why. The
  registry must let a check opt out of suppression.
- `packages/intentionsutil/scripts/check-durable-write-fence.ts` — the
  default-deny (negative-form) fence, corrected from a permissive form
  on 2026-08-15 after it failed **open** on `rationale`. Unit 1's unknown-key
  rejection follows the same polarity: a novel key refuses by default.
- `packages/intentionsutil/src/errors.ts` — `IntentionSchemaError`, the
  store-wide throw type, with the offending field named.
- `packages/intentionsutil/src/store.ts:232` `listNodes` and `:166`
  `readNodeBody` — the read path every deriver here uses; and `:194-196`
  `listNodesResilient`'s top-level-only `*.md` scan, which is why
  `intentions/operational/` subdirectories stay invisible to `validateGraph`.

## Verification

Auto-runnable:

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/reconciliation-frontier.ts intentions --json
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/check-registration-census.ts intentions
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/run-registered-checks.ts intentions
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Each fence is a **single statement** on purpose: `dispatch-run-verification`
executes a block as plain `bash` with no `set -e`, so in a multi-statement
block only the last statement decides pass/fail and an earlier assertion can
fail while the fence reports PASS. Spell every invocation
`node --import tsx/esm`, never `npx tsx` — the tsx CLI wrapper opens an IPC
socket the sandbox denies, throwing `listen EPERM` in `createIpcServer` before
it parses arguments (`.claude/rules/sandbox.md`).

Manual and judgment-bearing:

1. **The ratchet cannot fire early.** After unit 6, inspect
   `run-registered-checks.ts` output and confirm **every** registered check
   reports tier `observe`. Every transcribed criterion enters `deferred`, and
   under unit 2's rule a deferred criterion's check cannot gate at any pass
   history. A single `gating` line at this point means the sanction gate is
   wrong and must be fixed before the runner is wired into CI — this is the
   leak the 2026-09-01 adversarial review found, and the check is cheap.
2. **Landing does not turn `main` red.** Run `run-lint.sh` on a branch with an
   intentionally failing observe-tier check and confirm exit 0 with the failure
   printed. Observe-tier failures never block.
3. **The frontier is a projection, not a store.** Run the frontier CLI twice
   with no intervening edit and confirm byte-identical stdout; then amend one
   cited disposition's text and confirm a `stale-intent` entry appears with no
   write anywhere. If a run mutates any file under `intentions/`, the deriver
   has acquired a side effect and is wrong — `read-sensors.ts` is the known
   repo precedent for a "sensor" that writes, and this must not repeat it.
4. **Ratchet monotonicity.** Append a high-water record, confirm the check
   promotes to gating (once its criterion is ratified), and confirm no code
   path removes a high-water record — the operational store has no delete
   primitive by design.
5. **Deprecation drain gauge.** Record the `dangling-tooling-path` check's
   initial reading as a measured baseline. It is expected to be non-zero
   (34 `dispatch-token-audit` files, 39 `align-init` files at 2026-09-01) and
   to fall as the drain proceeds. Do **not** baseline it into a JSON
   grandfather list — the whole point is that the reading IS the remaining
   migration.
6. **P4 gate readiness** (`tactic-bootstrap-operation` completion criterion 1).
   The deriver runs live against `origin/main` and its output is reviewed
   before any queue consumer unfreezes. A queue means something only when it is
   derived from graph state, never hand-maintained residue.
7. **Author ratification is owed, not assumed.** Every criterion this plan
   records enters `deferred`. Ratifying them is an author act through
   office-hours or `/align`; nothing here may ratify, and no elevation of a
   frontier gap note into a bite may run without it (the anti-starvation
   sanction path: note → author ratification → ratified criterion → bite).
