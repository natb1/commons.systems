# Author sitting agenda — the dispatch/RSI window

Everything in the dispatch/RSI window that is waiting on **the author** and
nothing else, consolidated into one running order for a single sitting.

Sources: `plans/dispatch-rsi-pre-pr-sessions.md` and
`plans/dispatch-rsi-serialized-pr-plan.md`. Built by sweeping both documents
for author-blocking decisions and verifying every node against `origin/main` on
2026-08-23. Where this file and either source disagree, the disagreement is
called out inline — several of the sources' claims are stale, and one names a
sitting that does not exist.

**Ten items, four groups.** Seven are `/office-hours` sittings against a parked
node; three are plain rulings with no node behind them. Three further "sessions"
in the pre-PR document are **not** sittings at all and cannot be resolved here —
they are listed at the end so the omission is deliberate rather than an
oversight.

---

## Why this list is not either document's own list

The two source documents split on **"does it produce a diff?"** The companion
document says so in its own header: it holds "the **no-diff sessions** — the
work that produces no code but must happen before the PR it gates."

That is a real axis, but it is not the axis that matters for scheduling *you*.
The set that needs the author and the set that produces no diff are different
sets, and the gap between them is where work has been going missing:

| | Pre-PR document | PR plan's own table | Actually needs the author |
|---|---|---|---|
| Sittings against a parked node | 6 | 7 | **7** |
| Measurement runs (no author) | 3 | 3 | 0 |
| Rulings in unit prose, no node | 0 | 0 | **3** |
| Named sittings that do not exist | 0 | 1 | 0 |
| **Author-owed total** | 6 | 7 | **10** |

Three concrete divergences, each verified:

1. **Three author rulings appear in neither table.** They are recorded only in
   the PR plan's unit prose — PR16 Unit 5, PR17 Unit 4 and PR17 Unit 5 — and are
   invisible to both indexes. A fourth of the same shape, PR16 Unit 10, at least
   reached the PR plan's table. All four are Group C below.
2. **The PR plan names a sitting that does not exist.** At two places
   (`plans/dispatch-rsi-serialized-pr-plan.md:305` and `:4211`) it says
   `tactic-clarification-citation-ids` (#3041) "is `office_hours`-parked and is
   one of this plan's two named pre-PR sittings," and instructs "resolve the
   sitting first, then absorb." On `origin/main` that node is
   `office_hours: null`, `owner: ai`, `phase: review`. Its park was a
   mechanical `standdown-winner-dead-work-unpushed` fleet park — never a design
   sitting — and it was cleared on 2026-08-21 in `e03c20e0`. **There is nothing
   for you to sit.** PR19 has one named sitting, not two, and #3041 needs only
   absorbing. *(Corrected in the same change that adds this file.)*
3. **The companion omits `tactic-sensor-deregistration-gate` entirely.** It
   gates PR16 Unit 10, it is parked, `owner: human`, and it is a genuine risk
   decision — but it is not among the companion's nine sessions. It reaches the
   agenda only through the PR plan's table.

**Is the two-document split required?** The no-diff/diff axis is worth keeping
— the companion carries prompts far too long to inline into a 4,726-line plan.
But it is not being maintained as one source of truth, and it is indexed on the
wrong key. This file is the author-facing index; the companion stays as the
prompt store.

---

## Group A — What a band means, and whether its signal is real

**Two sittings plus the measurement that blocks a third — one conversation.**
Merge them: they are the same question at three magnifications, and deciding
them separately means deciding the later ones against numbers the earlier ones
just changed. A3 is not a sitting of its own; it is the ground that parked D1,
surfaced here because A1 and A2 are what actually resolve it.

### A1 · `tactic-review-band-derivation-ratification` — gates PR10

Ratify the 2026-08-12 band/residual resolution, held on trust across
`kind-kind`, `strategy-rsi-delegated-prioritization` and
`tactic-attention-namespaced-rank`. Three sub-points are on the node; two need
you specifically:

- **The load-bearing argument** for band deriving from *resolved* rank rather
  than the authored term: an authored-term band would make a strategy's own sort
  key the lexicographic pair `(authored, signal+capture)` and so reorder
  strategies against each other, violating
  `tactic-attention-namespaced-rank`'s assertion that strategies live on a
  single flat additive scale.
- **The searching one.** Under `band = resolved rank`, the cross-strategy
  inversion count that `success_signal` (b) measures is **structurally zero by
  construction** — the fitness criterion is unfalsifiable on that half. Confirm
  that is the intended reading (a bound enforced by the algebra) rather than a
  threshold made reachable by redefining what it counts.

The second point is the one worth your time. A fitness criterion that cannot
fail is not measuring anything.

### A2 · `tactic-review-dispatch-charter-split` — advisory, gates nothing

Split `strategy-graph-native-dispatch` by charter — recording surface, router
and selection, session lifecycle — because its tactic children all feed one
defect-ratio `success_signal`, so work of unlike kinds is counted as one defect
population.

**Partly discharged.** One charter, `strategy-discovered-requirements`, was
already carved out on 2026-08-13. What is open is only whether *further* splits
are warranted. The node's 167-byte body predates that split; read it against the
current strategy, not as written.

Two measurements the node carries forward: only **one** of the open children
holds a non-null `execution.strategy_fingerprint`, so the freeze cost of
re-homing doctrine off that node is near zero today; and
`strategy-explicit-intent` is the common ancestor of that strategy and
`strategy-discovered-requirements`, so doctrine binding every graph writer can
move **up** rather than sideways.

### A3 · The maintenance-burden band, which is blocking D1 *(Group D)*

`strategy-graph-native-dispatch`'s ARMED maintenance-burden condition requires
the open-machinery-defect population to stay at or below **35%** of all tactics
serving it, **and** to be non-increasing across consecutive samples. It measures
false on both limbs, and that failure is what parked
`tactic-align-audit-legacy-review`.

**Re-measured for this agenda at `origin/main` (2026-08-23), through
`classifyTactic` / `strategyBacklogBand` semantics
(`packages/intentionsutil/src/census.ts:13,26`):**

```
strategy-graph-native-dispatch tactics: 314
  done 101 · open 78 · born-parked 57 · draft 78
  backlog (open + born-parked) = 135/314 = 42.99%   [ceiling 35%]
```

Two things this changes. The ceiling limb still fails, decisively — 43% against
a 35% bound. But the **non-increasing limb now has a descending sample**: the
node recorded 43.67% at `76abc77a` and 44.30% at `a5ddeca1`, and it is 42.99%
today. The monotonic rise the park documented has broken.

**Why this belongs with A1 and A2.** The park discloses a mechanism that makes
the signal partly self-referential: `classifyTactic` scores `born-parked` as
backlog and `draft` as neither, so *parking a draft moves it into the numerator
the band measures*. The node's own park raised the ratio by exactly 1. A band
that a park can move, and that a finalize moves identically, cannot distinguish
the two — which is A1's unfalsifiability question wearing different clothes, and
A2 is the proposed structural fix.

> **Decide A2 before D1.** Splitting the strategy re-cuts the denominator this
> band divides by. Ruling on A2 first makes D1 a bookkeeping step; ruling on it
> after means re-measuring.

**Estimated:** ~45 author-minutes for the group.

---

## Group B — Ratifying what Claude derived and you hold on trust

**Three sittings, one conversation.** Identical shape: Claude produced the
content, you accepted it without verifying, and a PR is about to make it
load-bearing. Same disposition vocabulary throughout — ratify, amend, or
overturn — and the same failure mode: a PR encodes an unratified inference.

### B1 · `tactic-review-supersession-derived-subpoints` — gates PR19 · **most urgent**

Two sub-points recorded on `strategy-graph-native-dispatch` on 2026-08-14 that
**Claude derived and no author ruled**:

1. A node whose `execution` is non-null gets the supersession edge but is **not
   parked**.
2. Only a **fully** superseded node is parked; partial supersession keeps
   clarification 26's per-unit doomed-drop and parks nothing.

The node records the consequence of each being wrong. For (1): a live PR keeps
landing work on superseded surface, which clarification 26 permits only as an
explicit interim-live-risk exception naming an expiry event — **and no expiry
event is named here.** For (2): a node most of whose units are doomed stays
selectable with no park to surface it.

**Why this one first.** PR19 Unit 1 encodes both behaviors into the schema — a
`superseded_by` edge and a `superseded` status terminal. That is data, not code:
unwinding it later means a migration. The node body is 222 bytes; the reasoning
lives on the strategy. Read the 2026-08-14 supersession clarification before
sitting.

Clearing this park means you have ratified both, **or** overturned them and
`tactic-finding-search-all-producers` has been amended to match.

### B2 · `tactic-review-sitting-code-review-lock-design` — gates PR6

The 2026-08-13 `/align` round raised built-in `/code-review` from `low` to
`high`. You declined the offered options for how a detached run holds its node
and delegated the choice — *"Recommend the best greenfield locking mechanism"* —
so the recorded flock mechanism is Claude's articulation, not your decision.

Two limits were recorded rather than buried, and they are the natural agenda:
flock is **advisory**, so it binds only claimers that check and a human entering
the worktree by hand bypasses it; and flock availability plus `setsid`
fd-inheritance inside a dispatch worktree are **unverified**.

> **Hand the sitting this framing.** There is a live contradiction to resolve,
> not a design to bless. The flock shipped in #3078, yet
> `tactic-eval-finding-detached-code-review-dies-with-launcher` shows the
> detached child dies with its launcher anyway, despite `setsid`. **A lock held
> by a process that dies with its launcher is not a lock.** So: should the lock
> be held by the detached child at all, or by a supervisor that outlives both?
> If the answer is the supervisor, PR6 Unit 2 changes shape entirely.

**A second, separable call rides along** — a sequencing judgment the companion
flags as genuine and unresolved. PR6's units are ordered so detachment is fixed
*and demonstrated* (Unit 1) before the lock is trusted (Unit 2). Two defensible
readings:

- **Sitting first, strictly** — the plan's stated position, cheapest, and PR6
  never implements a refuted design.
- **Unit 1 first, then the sitting, then Unit 2** — the sitting gets evidence
  instead of argument about whether a detached child can hold anything.

Given the contradiction above, the second reading has gained weight since it was
written: the demonstration is exactly what would settle the central question.

### B3 · `tactic-review-tradition-agentic-engineering` — gates PR11 · **optional here**

Mode-A curriculum enrollment for `tradition-agentic-engineering`. The record was
created via the immediate-record path at `status: delegated`, so three things
are held on trust from the recording interview: the adopted entry, the diverged
entry, and the already-load-bearing judgment. The sitting also re-ratifies the
seed list and stamps `last_assessed`.

> **The node recommends waiting, and it is worth honoring.** Its recorded
> recommendation: *"Run after the first two or three `/rsi-research` cycles have
> landed readings, so the sitting reviews the lane's real output alongside the
> record; ~30 author-minutes."* Sitting it today means reviewing the record
> against nothing. **Include it only if you want PR11 unblocked now** — otherwise
> it is the one item on this agenda with a good reason to be left out.

**Estimated:** ~40 minutes for B1 + B2; +30 recorded on the node for B3.

---

## Group C — Unit shape rulings

**Four rulings, one conversation, fast.** Each blocks exactly one unit, each is
already framed as a two-way choice with a recommendation on record, and none
needs research. Only C1 has a node and a park — **C2, C3 and C4 have no node at
all**, so they cannot be run through `/office-hours`; they are rulings you record
in the plan and the implementing PR.

### C1 · `tactic-sensor-deregistration-gate` — blocks PR16 Unit 10 *(has a node; parked)*

A sensor name is prose-coupled: renaming the prose silently de-registers the
sensor, which then reads `null` while everything stays green. Rule between two
gate shapes:

1. **Node-scoped fatal inside `guard`** — fail when the name was bound at
   `origin/main` and is unbound after this write. Gates at write time, which is
   the literal wording of the brief. **But** it puts a new `origin/main` read
   inside the one job whose failure mode is repo-wide write denial — the
   2026-08-14 outage, 54 minutes and three blocked writes, none of them about
   sensors. Getting it wrong re-arms exactly that.
2. **Post-merge check on `main`** — cannot deny any write, so it cannot re-arm
   the outage; detects after the fact.

**Recommendation on record: (2) first for the detection floor, (1) later as the
real gate.**

> **The premise under (2) changed on 2026-08-23 and the change favors the
> recommendation.** The node said (2) "needs a new workflow — nothing currently
> runs on a `main` push outside path-scoped deploys." That is no longer true.
> #3108 removed `main` from `branches-ignore` in `.github/workflows/unit-tests.yml`,
> and `graph-validate` is a job **inside** that workflow, so it now runs on every
> push to `main` — including the direct pushes `graph-commit` uses. Verified, not
> inferred: the graph write that landed this correction triggered run
> `32649739808`, in which `graph-validate` ran and passed. **(2) now needs only
> the binding-comparison check, not a workflow to host it.** The corrected premise
> is on the node; the (1)/(2) choice and the recommendation are untouched and
> still yours.
>
> Two things this does **not** change: the `graph/**` half of the blind spot is
> unchanged (those refs are still ignored), and `validate-graph` remains
> deliberately non-fatal on de-registration, so nothing goes red today either way.

### C2 · `readDelegationRecordsReading` — blocks PR16 Unit 5 *(no node)*

`read-sensors.ts`'s `readDelegationRecordsReading` is unreachable from
production code, superseded by two per-strategy reading functions landed on
`tactic-first-sensor-pass`. But it is **the only code implementing a doctrine
rule** — excluding declined delegation records from unexercised counts for
`strategy-exercise-recovery-paths`.

**The question: does that rule still govern the new readings?** If yes, port it
and delete the dead function. If no, record that and delete. Deleting without
deciding silently drops the rule — which is the exact failure the unit exists to
prevent. There is no default here; this one genuinely needs an answer.

### C3 · Fleet-alarm frozen-tactic clobber — blocks PR17 Unit 4 *(no node)*

A `tactic-fleet-alarm-<kind>` node is minted, parked, and clobbered by the next
mint — observed ~14 times on one node, 14 ending in a frozen worker rather than a
clean disposition. Two shapes:

- **(a)** exclude the `tactic-fleet-alarm-<kind>` family from `router.ts`'s
  frozen-tactic candidate loop;
- **(b)** additionally harden `dispatch-fleet-alarm`'s `classify()` to be
  park-aware, as defense in depth.

**On record: (a) is the fix, (b) is optional hardening.** Record the choice on
the node.

### C4 · Park content, delete/modify branch — shapes PR17 Unit 5 *(no node)*

A park must carry the losing writer's content, not a pointer to it —
`park_write()` preserves content by pointing at `SNAP_DIR`, a bare `mktemp -d`,
which survives the process but not the machine, the tmp reaper, or the container.

Two branches, and only one is fixable the obvious way. The **ordinary
lost-writer** branch commits `origin/main`'s content plus the `office_hours`
block, so carrying content in `office_hours.recommendation` repairs it. The
**delete/modify** branch does not land the record at all — by its own text the
record "is LOCAL ONLY — it exists nowhere on `origin/main`, because the node does
not."

**The call: fix the ordinary branch only, or both.** If only the first, the
delete/modify residue **must be recorded on the node** rather than the node being
closed silently. This is more a scope decision than a design one — a minute, not
ten.

**Estimated:** ~20 minutes for the group.

---

## Group D — `/align-audit`: already decided, needs a disposition

### D1 · `tactic-align-audit-legacy-review` — gates PR20

Both source documents describe this as a sitting that decides `/align-audit`'s
inclusion of the two engines the `/align` consolidation retired. **That framing
is stale — all three of its decisions were verified landed at their homes**, and
the node's own park says so:

- **D1 (engine inclusion)** — recorded as a 2026-07-23 clarification on
  `tactic-align-audit-skill`, and the retirement **shipped**. Verified today:
  `.claude/skills/align-init/` and `.claude/skills/align-strategy/` are both
  absent from the tree.
- **D2 (successor-cadence deferral)** — ratified with the SUCCESSOR framing
  intact, resolved 2026-07-23 on `strategy-explicit-intent`.
- **D3 (`tactic-condition-review-sweep` rehoming)** — home ratified 2026-07-23;
  that node is now `status: raw`, `phase: null`, `office_hours: null`,
  `blocked_by: []`.

So the sitting is **achieved on its three decisions**. What actually remains is
two things, and neither is the decision the documents advertise:

**(i) The prune is owed but not prune-ready.** The node's body ends "this tactic
is achieved and prune is owed at a future census once the census-line amendment
lands." That precondition is **not satisfied**.

**(ii) There is an untracked residue — verified today.** The one piece of retired
engine-2 content the 2026-07-23 sitting decided to **keep** — the unserved-virtue
census, as an info-only report line in `/align-audit` — is **absent from
`.claude/skills/align-audit/SKILL.md`**. Confirmed: grepping that file for
`census`, `unserved`, `info-only` or `report-only` returns nothing. Its vehicle
`tactic-align-audit-skill` is `phase: done` (PR #2879, merged 2026-08-20), so it
closed without carrying the amendment, and the clarification's own contingency —
*"If PR #2879 is already past implement when this lands, apply it as a follow-up
unit"* — was never filed. **No node in `intentions/` tracks it.**

Partial mitigation, so the capability is not lost: the mechanical unserved-virtues
computation **is** live, but in a different home —
`packages/intentionsutil/scripts/align-strategy-census.ts:63-74`
(`printUnservedVirtues`), which is the `/align` census, not the `/align-audit`
report. Verified present today.

**What you owe here:** rule whether the missing report line still matters. If it
does, it needs a node — it currently has nothing tracking it anywhere. If it does
not, say so and the prune precondition is satisfied. Either way this is minutes,
**once Group A has settled the band** that forms the park's other ground.

**Estimated:** ~15 minutes, after Group A.

---

## Not in this sitting — three measurement sessions

The pre-PR document lists these among its nine "sessions," but they need an
`/rsi-audit` run, not author time. **They cannot be resolved in a sitting**, and
two of the three can run unattended today. All three are `owner: ai`.

| Node | Gates | Status |
|---|---|---|
| `tactic-dispatch-cache-preserving-context` | PR7 | **Runnable now.** Its `blocked_by` edge reads as "Bundle 4 first," but the blocker's deliverable already shipped — `hit_ratio` is emitted at `aggregate-usage.sh:1211`. Live by the code, open by the graph. Bundle 4 runs before PR7 anyway, so following the graph costs nothing |
| `tactic-rsi-measure-fanout-and-model-routing` | PR11 | **Runnable now.** The instrument already counts `subagents_launched` (`aggregate-usage.sh:1052-1070`). Load-bearing: PR11's lens catalog declares a `model:` per lens, and setting those from unmeasured external numbers is the exact error this node exists to prevent — the CooperBench figures were measured on shared-code collaboration, and this repo fans out across separate worktrees |
| `tactic-dispatch-observation-masking` | PR7 | **Splits.** The cost half runs now on this window's own sessions. The **quality half cannot precede the PR it gates** — it needs dispatch-phase sessions with a working ladder, which Bundle 3 delivers, and PR7 is inside Bundle 3. Ship PR7 against the cost half; treat the quality half as a follow-up that may revise it. *(Note: the node's rationale calls the third lens `context_lens`; no such key exists — it is `lenses.context_over_120k`. Fix the prose while you are in the node.)* |

---

## Conditional — not yet due

**PR15 ref-split revisit.** Session 0 ran on 2026-08-14 and recorded **(b)
DEFER**, but its third finding attached a standing hold: *"PR15's Units 1–2 are
subsumed by ref-split's Unit 2 rewrite — do not start PR15 before revisiting this
disposition."* This is a real author decision, but it comes due only when PR15 is
reached. Do not spend the sitting on it.

---

## Running order

Dependency-ordered, not importance-ordered:

```
1. Group A  (A1 → A2 → A3)   the band and its signal      ~45 min
2. Group B  (B1 → B2 [→ B3]) the trust ratifications      ~40 min (+30 for B3)
3. Group C  (C1 → C2 → C3 → C4) unit shape rulings        ~20 min
4. Group D  (D1)             /align-audit disposition     ~15 min
                                                     ≈ 2 hours
```

Two hard orderings, both forward-only:

- **A2 before D1.** Splitting the strategy re-cuts the denominator D1's park
  reads. Decide the split first and D1 is bookkeeping; decide it after and D1
  must be re-measured.
- **B1 before PR19 opens.** It is the only item on this agenda whose cost of
  being wrong is a data migration rather than a code change.

Everything else is free to reorder. Time figures are estimates except B3's
30 minutes, which is recorded on its node.

---

## After the sitting — parks do not clear themselves

**`/office-hours` is read-only.** By its own description it "reviews read-only,
reports where to engage, and stops; takes no fix/label/close/phase/graph
action." The sitting produces a disposition; **completing and unparking the node
is a separate manual step.** Do not treat a finished sitting as a cleared gate —
a PR gated on one of these will still see the park.

The seven parked nodes — A1, A2, B1, B2, B3, C1 and D1 — each need their park
cleared explicitly:

```
packages/intentionsutil/scripts/clear-park -C <repo-root> <node-id> "<disposition note>"
```

`-C` is **required and has no default**; it is passed straight through to
`graph-commit`'s own `-C`, so the script and the write can never target
different trees. The script fetches `origin/main` and rebases the node's content
onto it before mutating, so it is safe to run from a stale worktree.

Group C's C2, C3 and C4 have no node and no park. Their rulings are recorded in
the plan and carried into the implementing PR.
