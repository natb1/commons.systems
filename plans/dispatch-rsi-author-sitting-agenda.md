# The dispatch/RSI window — prerequisites and serial PR sequence

**This is the single agenda for the window.** It carries two things and is the
only document that carries both:

- **Part I — Prerequisites.** Every decision waiting on *the author* that blocks
  any other item on this agenda: ten items in four groups, ordered for one
  sitting of roughly two hours.
- **Part II — The serial PR sequence.** Every PR needed to reach the end of this
  batched waterfall, in execution order, with each one's gate, node count and
  dependencies. Thirteen positions, PR2 through PR20, plus the overhang
  retirement that precedes them all.

The scope of the window is: **retire the open in-flight bugs, then land the
greenfield design for the RSI, for `/align` graph management (its tooling and
its data structure), and for the dispatch ladder (including automated
scheduling)** — executed serially, by hand, while all other implementation work
is frozen.

Sources: `plans/dispatch-rsi-serialized-pr-plan.md` (the executable per-PR
detail — every section there is clean-session-executable and this file does not
restate it) and `plans/dispatch-rsi-pre-pr-sessions.md` (the sitting prompts).
Built by sweeping both and verifying every node against `origin/main`; Part I
verified 2026-08-23, Part II 2026-08-28. Where this file and either source
disagree, the disagreement is called out inline — several of the sources'
claims are stale, and one named a sitting that does not exist.

---

## The premise: the freeze is held, not waited out

Four ground rules were set by the author and hold across everything below.

1. **No carrier node.** These PRs are implemented ad-hoc, in sessions that
   bypass the dispatch ladder. No node carries `execution.pr`; a PR is a plain
   branch off `main`.
2. **Node bookkeeping is an explicit post-merge step**, not a ladder
   transition. Each PR section in the plan ends with the exact write that closes
   its nodes.
3. **All three large refactors are in scope** — lens-catalog decomposition,
   intervention-core extraction, dispatch skill rename — and are sequenced last,
   because each rewrites surfaces the earlier PRs edit.
4. **The freeze does not lift until this plan is done.** The pause sentinel is
   not an outage to work around and not a window that might close mid-flight; it
   is the enabling condition. Any step reading "before resumption" means before
   *that* point, not before some externally scheduled restart.

**What the freeze does not stop.** The sentinel gates worker *spawning* and
scheduling. It does not gate ledger bookkeeping and **it does not freeze
`main`** — a paused tick still runs five sweeps and drains the node lane. Plan
accordingly: `main` moves under you while the window is open, which is why the
plan's anchors need re-verification and why several PRs guard against a
concurrently landed write being clobbered.

---

# Part I — Prerequisites

> ## ✅ SITTING HELD 2026-08-28 — all ten items ruled, all eleven parks cleared
>
> Every Part I item below is discharged. Eleven parked nodes were cleared with
> `clear-park`, each carrying its full disposition, and all eleven verify
> `office_hours: null` on `origin/main`. **Every Part II position that carried
> an author gate — 1, 2, 6, 7, 8 and 9 — is unblocked.**
>
> The seven the sitting was convened for: `61b88950` (A1), `08447ab8` (A2),
> `34f9ab31` (B1), `699b4b26` (B2), `c78f8cd3` (B3), `37e321ca` (C1),
> `751982b0` (D1). The four the sitting *found* — C2's, C3's and C4's nodes,
> which the text below wrongly said did not exist — cleared after the rulings
> were recorded: `ee3ccd64` (C2), `756a06f0` (C3), `f093e607` and `59ea8410`
> (C4).
>
> | item | ruling | landed |
> |---|---|---|
> | A1 | (1) ratified on the code's ground; (2) recorded **superseded** (the residual no longer exists — the key is `(tier, band, score, depth)`); (3) **amend** `success_signal` (b) to measure the writable surface | `61b88950` |
> | A2 | **Split ruled in.** Re-serve of the 316 children **deferred past position 12** so it cannot invalidate the `--base` CAS manifests | `08447ab8` |
> | A3 | Re-derived, not quoted: **136/316 = 43.04%** at sitting start against a 35% ceiling. Rising-monotonically limb withdrawn | *(folded into A2/D1)* |
> | B1 | ONE **amended** — no park, but the edge must name its expiry event; TWO **ratified**, per-unit drop's carrier stated explicitly | `34f9ab31` |
> | B2 | **flock ratified**, held by the child; its precondition repaired by `systemd-run --user` re-parenting. Sitting-first order stands | `699b4b26` |
> | B3 | **Split** — trust half sat, lane half deferred. Its precondition was *circular* | `c78f8cd3` |
> | C1 | **(2) then (1)**, and (2) must be **FATAL**, not a stderr warning | `37e321ca` |
> | C2 | Rule **still governs** — port it, **retarget** its two tests, amend the threshold, then delete the dead function | *(plan)* |
> | C3 | **Both (a) and (b)** in **PR18** Unit 4 — they fix different halves of the loop | *(plan)* |
> | C4 | **Ordinary branch only**; record the delete/modify residue (**PR18** Unit 5) | *(plan)* |
>
> **Three corrections this sitting made to the text below.**
>
> 1. **"Only C1 has a node and a park — C2, C3 and C4 have no node at all" is
>    wrong.** Each had a *parked* node on `origin/main`:
>    `tactic-orphaned-delegation-records-reading` (C2, parked 2026-08-20),
>    `tactic-fleet-alarm-node-park-clobber-loop` (C3, parked 2026-08-04), and for
>    C4 both `tactic-graph-commit-park-content-durability` (2026-08-21) and
>    `tactic-graph-commit-delete-vs-edit-park-hardening` (2026-08-10). Their
>    rulings are recorded in the PR plan. **All four have since been cleared**
>    (`ee3ccd64`, `756a06f0`, `f093e607`, `59ea8410`), so no PR in this window
>    now walks into one.
> 2. **D1 was not bookkeeping.** Its park carries *two* rulings, and the first is
>    the strategy-wide band disposition. It was ruled **(c) accept the breach with
>    remediation**, keeping the 35% target and naming Part II itself as the drain
>    plan. Its "blocks eleven nodes" figure is stale: **82** tactics serving
>    `strategy-graph-native-dispatch` are parked today.
> 3. **B3's recommendation could not be honored as written.** `/rsi-research` does
>    not exist; it is built by **PR14 Unit 3**, in the same position (8) that B3
>    gates. Waiting for its cycles would block position 8 on output from a lane
>    position 8 builds.
> 4. **C3 and C4 are `PR18` Units 4 and 5, not `PR17`'s** — and therefore they
>    gate **position 1**, not position 11. PR17's Unit 4 is "cap the alert rows"
>    and its Unit 5 is "stop leaking scratch refs"; neither is related. PR18's own
>    "Nodes closed (5)" list contains both `tactic-fleet-alarm-node-park-clobber-loop`
>    and `tactic-graph-commit-park-content-durability`. So position 1 was **not**
>    gate-free as the sequence table claimed — it carried two ungated author
>    rulings, both of which this sitting made. **Seven** of the thirteen positions
>    carried an author gate, not six: 1, 2, 6, 7, 8, 9 — and not 11.
>
> Owed follow-on writes are listed at the end of this Part under
> "Owed after the sitting".

Everything waiting on the author and nothing else, consolidated into one running
order for a single sitting.

**Ten items, four groups.** Seven are `/office-hours` sittings against a parked
node; three are plain rulings with no node behind them. Three further "sessions"
in the pre-PR document are **not** sittings at all and cannot be resolved here —
they are listed at the end of this Part so the omission is deliberate rather
than an oversight.

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
   the PR plan's unit prose — PR16 Unit 5, PR18 Unit 4 and PR18 Unit 5 — and are
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

### A2 · `tactic-review-dispatch-charter-split` — gates no PR, but precedes D1

Split `strategy-graph-native-dispatch` by charter — recording surface, router
and selection, session lifecycle — because its tactic children all feed one
defect-ratio `success_signal`, so work of unlike kinds is counted as one defect
population.

**Partly discharged.** One charter, `strategy-discovered-requirements`, was
already carved out on 2026-08-13. What is open is only whether *further* splits
are warranted. The node's 167-byte body predates that split; read it against the
current strategy, not as written.

**The population is still growing.** The node was authored against **275**
children measured 2026-08-14; there are **316** today. Two weeks added 41. That
strengthens the finding rather than dating it — the single defect ratio is
averaging over more unlike work than when the split was proposed, not less.
*(The node's statement was corrected to 316 in `fb26a783`; its rationale and
park keep 275, both being explicitly dated to the original measurement.)*

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

**Re-measured for this agenda at `origin/main` `96dc5a14` (2026-08-28),
through `classifyTactic` / `strategyBacklogBand` semantics
(`packages/intentionsutil/src/census.ts:13,26`):**

```
strategy-graph-native-dispatch tactics: 316
  done 102 · open 79 · born-parked 57 · draft 78
  backlog (open + born-parked) = 136/316 = 43.04%   [ceiling 35%]
```

Measured over `git archive origin/main intentions` rather than `listNodes`,
which reads the worktree on disk and absorbs untracked strays — the error that
put an earlier round's figure off by one node in both terms. Cross-checks
against the independently-recorded 136/316 = 43.04% at `b45c0d31` on
`tactic-qa-main-node-terminal-declaration`.

Two things this changes. The ceiling limb still fails, decisively — 43% against
a 35% bound, so the ground for the park is untouched. But the **non-increasing
limb now has a descending sample**: the node recorded 43.67% at `76abc77a` and
44.30% at `a5ddeca1`, and it is 43.04% today, at the same denominator of 316 —
so the fall is a real change in the numerator, not dilution by new filings. The
monotonic rise the park documented has broken. *(This correction was landed onto
`tactic-align-audit-legacy-review` itself in `fb26a783`, so a session reading
the node no longer finds the withdrawn trend claim standing unqualified.)*

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

### C3 · Fleet-alarm frozen-tactic clobber — blocks **PR18** Unit 4 *(has a node; parked)*

A `tactic-fleet-alarm-<kind>` node is minted, parked, and clobbered by the next
mint — observed ~14 times on one node, 14 ending in a frozen worker rather than a
clean disposition. Two shapes:

- **(a)** exclude the `tactic-fleet-alarm-<kind>` family from `router.ts`'s
  frozen-tactic candidate loop;
- **(b)** additionally harden `dispatch-fleet-alarm`'s `classify()` to be
  park-aware, as defense in depth.

**On record: (a) is the fix, (b) is optional hardening.** Record the choice on
the node.

### C4 · Park content, delete/modify branch — shapes **PR18** Unit 5 *(has nodes; parked)*

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

## Running order for the sitting

Dependency-ordered, not importance-ordered. This is the order for Part I only;
the execution order for the PRs those decisions unblock is Part II.

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

Group C's C2, C3 and C4 each turned out to have a parked node after all — four
between them — *(corrected 2026-08-28)*. Their rulings are recorded in the plan
and carried into the implementing PR, and the four parks were cleared once the
rulings were on record.

---

## Owed after the sitting — writes the rulings imply

None of these were executed by the sitting; each is a follow-on write.

**Graph edits**

- `strategy-rsi-delegated-prioritization` — amend `success_signal` (b) per A1:
  drop the structurally-zero cross-strategy inversion count, replace it with
  model attention writes onto a **strategy's own** `attention` block, and retain
  the existing no-`priority_log`-entry count. Both counts land on
  `tactic-priority-provenance-schema`'s lint, which is unbuilt (`status: raw`,
  `phase: null`).
- `tactic-finding-search-all-producers` — amend to match B1. Its "Two sub-points
  the author did not rule on" section is now stale and would mislead PR19's
  implementer; item 4 needs the expiry-event requirement recorded.
- `tradition-agentic-engineering` — amend `attributes.adopted` to the
  three-idioms-plus-convergence wording per B3 item (1), and stamp
  `last_assessed: 2026-08-28`.
- A dedicated `/align` round against `strategy-graph-native-dispatch` per A2:
  child count and boundaries, the disposition of its ~30 conditions between the
  children and `strategy-explicit-intent`, and the lifecycle `success_signal`
  edit — which needs a paired `read-sensors.ts` `LIFECYCLE_SENSOR_NAME` change
  `graph-commit` cannot carry.
- `strategy-exercise-recovery-paths` — amend `success_signal.threshold` per
  C2. `deriveGap` (`packages/intentionsutil/src/sensors.ts:241-255`) is trimmed,
  case-insensitive **string equality**, so porting the declined-origin rule into
  the reader changes the reading string and closes nothing on its own. The
  threshold must exclude declined-origin records from the
  no-null-`last_exercised` requirement — otherwise
  `delegation-hosted-publishing` keeps it permanently unsatisfiable, which is
  the very fact the C2 ruling rests on. *(Added 2026-08-28, after the ruling was
  first recorded; the node's park text names it and the ruling had dropped it.)*

- **One new tactic serving `strategy-graph-integrity`** for D1's doc residue.
  Mandatory regardless of the census withdrawal: `.claude/docs/delegability.md`
  (11-12), `.claude/docs/signal-identification.md` (11-12) and
  `.claude/skills/align-audit/SKILL.md` (332) all still frame the 2026-07-23
  Decision 1 as *pending* and name `tactic-align-audit-legacy-review` as its
  decider. Pruning that node without this fix leaves three sites pointing at a
  node that no longer exists.

**Parks** — none outstanding. The four the sitting found on C2/C3/C4's nodes
were cleared after their rulings were recorded; see correction 1 above.

**Plan edits**

- **PR6 Unit 1 is mis-scoped.** It reads "Establish real detachment (process
  group / session leader)" — precisely the remedy
  `tactic-eval-finding-detached-code-review-dies-with-launcher`'s *Corrected
  diagnosis (2026-08-14)* falsified, since the script already runs `setsid`,
  disowns, and hard-refuses to start without it. Re-scope to `systemd-run --user`
  transient-unit re-parenting, keeping the interrupt verification as the
  confirming step.

**Rescue before reaping**

- `.claude/worktrees/tactic-align-audit-legacy-review/intentions/tactic-retire-assessor-contract-docs.md`
  — 10,509 bytes, on no branch, lost when that worktree is reaped.


# Part II — The serial PR sequence

Thirteen positions from here to the staged resumption. Every position is a
**bundle** — PRs grouped by shared code surface, because the work is serialized
and the cost of a large PR is lower than the cost of two PRs touching the same
file. The per-PR executable detail is in
`plans/dispatch-rsi-serialized-pr-plan.md`; this table is the order, the gates
and the reasons for the order.

**117 tactics are assigned across the sequence**, none twice, plus 11
documented-and-deliberately-unassigned and 13 more absorbed by the overhang
retirement. 38 of the 117 sit on the graph read/write path — the largest single
surface in the window, and the one every other PR's bookkeeping runs through.

## The sequence

| # | Bundle | PRs | Nodes | Author gate | Why here |
|---|---|---|---|---|---|
| ✅ | 1 · graph read/write path | PR1 | 8 | — | **SHIPPED `fe0b1c4d`** (#3095) |
| **0** | 0 · retire the in-flight overhang | *no new PRs* | +13 | — | **IN PROGRESS** — clears the drafts every later bundle would conflict with |
| **1** | 1c · durable-layer write fence | PR18 | 5 | **C3**, **C4** *(both ruled 2026-08-28)* | HOT. The fence ~100 remaining node closures write through |
| **2** | 1b · graph plumbing | PR15 + PR16 | 15 | **C1**, **C2**; PR15 carries a conditional hold | HOT. The closure toolchain itself |
| **3** | 2a · record-time main-qa routing | PR5a | 1 | — | Must precede Bundle 2 |
| **4** | 2 · tick-path reconcilers and sweeps | PR5 + PR9 U2,U6 + PR2 U6 | 10 | — | HOT. Runs on every tick, paused or not |
| **5** | 4 · instrument + finding surface | PR3 + PR4 | 16 | — | COLD, but unblocks positions 6 and 8 |
| **6** | 2b · supersession representation | PR19 | 3 | **B1** | Real `blocked_by` edge onto PR4's write surface |
| **7** | 3 · dispatch runtime | PR2 rest + PR6 + PR7 + PR8 U1–2 + PR9 rest | 25 | **B2** (PR6) | COLD. Nothing invokes it while paused |
| **8** | 5 · RSI chain | PR10 + PR11 + PR12 + PR14 | 10 | **A1** (PR10), **B3** (PR11) | COLD. Needs PR2 + PR3 + PR4 |
| **9** | 5b · `/align` charter + adversarial review | PR20 | 8 | **D1** | **Must** precede the rename |
| **10** | 6 · skill rename | PR13 | 1 | — | Last, alone. Renames every path PR20 writes |
| **11** | 7 · merge queue + scan cadence | PR17 | 6 | — *(was listed as C3, C4 — wrong; those are PR18's)* | COLD. Must be in place *before* the resumption |
| **12** | 8 · the four deferred A3 drafts | #3093 → #2856 → #3040 → #3037 | 4 | — | Last. Bulk node-content rewrites invalidate every `--base` CAS manifest |
| — | *staged resumption* | — | — | — | Sentinel off at `max_concurrent_workers: 1`, one node through the full ladder |
| — | *deferred outright* | PR8 U3 | 1 | — | Rewrites the freeze mechanism; only during an attended un-pause |

**Seven of the thirteen positions carry an author gate** — 1, 2, 6, 7, 8, 9 —
*(corrected 2026-08-28: position 1 carries C3 and C4, which were mis-filed under
position 11's PR17; PR17 itself has no author gate)* —
and every one of those gates is in Part I, so a single sitting unblocks the
whole sequence. That is the argument for holding the sitting before position 1
rather than at each gate as it is reached.

Part I's remaining four items do not gate a position directly: A2 and A3 both
feed D1, which gates position 9; C2 rides along with C1 at position 2; and PR15's
ref-split revisit is conditional on reaching position 2, not on the sitting.

## Position by position

### Position 0 · Bundle 0 — retire the in-flight overhang

Opens no PR. It lands already-mergeable work, splits or closes the drafts that
would conflict with later bundles, and folds orphaned nodes into the sections
that own them. It went first for one mechanical reason — #3037 deletes
`dispatch-graph-census`, Bundle 1c's Unit 1 target — and that reason is now
discharged.

**Status.** Six of seven steps are complete. Step 5 (the twelve class-A1
drafts) ran its redundancy gate: **0 of 12 passed**, so blanket-closing was
refused — 8,006 of the 10,866 added lines merge into today's `main` cleanly and
live in modules this plan never mentions. The disposition became *split at the
conflict boundary*, and **five clean halves have landed**: #2946 → #3099,
#3054 → #3101, #3018 → #3102, #3056 → #3104, #3064 → #3105. Those five source
drafts are closed.

**Seven drafts remain open by ruling**, not by omission — for each, the
contested content is still worth reading as a diff when its bundle is reached:
#2974 and #2975 (PR16's `transition-node` surface), #2993 (PR12's
`dispatch-stop.sh`), #3002 (PR5's `reconcile-graph-review-stall`), #3023
(PR16's fingerprint stamp), #3041 (PR19 — absorb directly; no sitting exists),
#3057 (PR8's selector bound).

### Position 1 · Bundle 1c — PR18, the durable-layer write fence

5 nodes. `dispatch-eval-finding`, `dispatch-graph-census`, `/dispatch-conflict`,
`/review-fix`, `router.ts`, `graph-commit`'s park path.

Front of the queue for two reasons. Mechanically, its one `blocked_by` edge
cleared when PR1's nodes closed, so it is ready and nothing else is. By
argument, it is the fence that decides what an **autonomous** writer may do to
durable node content — and roughly a hundred node closures still run through
that fence. It sits ahead of Bundle 1b because it carries no ref-split exposure
and PR15 does.

**Gates: C3** (fleet-alarm frozen-tactic clobber, **Unit 4**) and **C4** (park
content durability, **Unit 5**) — *both ruled 2026-08-28*. This position was
listed as ungated because C3 and C4 were mis-filed under PR17. PR18's own "Nodes
closed (5)" list contains `tactic-fleet-alarm-node-park-clobber-loop` and
`tactic-graph-commit-park-content-durability`, which are exactly C3's and C4's
nodes. Those two parks are **still set** — clear them before or during this PR.

### Position 2 · Bundle 1b — PR15 + PR16, the graph plumbing

15 nodes; the closure toolchain every later bundle's bookkeeping runs through.

**PR16** (11 nodes — `transition-node`, `park-node`/`clear-park`,
`read-sensors.ts`, `validate-graph`, `verify-landed`) is the half worth landing
here. It carries **two Part I gates**: C1 shapes Unit 10's sensor-deregistration
guard, and C2 decides Unit 5's fate. It also absorbs #3023, #2975 and #2974.

**PR15** (4 nodes — `graph-commit` simplification) carries a **conditional
hold**, not an author gate for this sitting: the 2026-08-14 ref-split
disposition recorded *defer*, but attached a standing instruction to revisit
before PR15 starts, since ref-split's Unit 2 rewrite would subsume PR15's Units
1–2. That decision comes due when this position is reached, not before — it is
listed under "Conditional — not yet due" in Part I for exactly that reason.
PR16 does not share the exposure and may proceed independently.

Kept separate from Bundle 1 deliberately: both touch `graph-commit`, but Bundle
1 was correctness and this is simplification. Landing them together would mean a
regression in the writer could not be bisected against a known-good one.

### Position 3 · Bundle 2a — PR5a, record-time main-qa routing

1 node. Small and out of order on purpose: it was never in the original scope
(it was `phase: implement` on 2026-08-14, so the `phase: null` filter excluded
it), and it must precede Bundle 2's reconciler work. **No author gate.**

### Position 4 · Bundle 2 — tick-path reconcilers and sweeps

10 nodes: PR5 plus PR9 Units 2 and 6 and PR2 Unit 6.

**This is the only bundle that is hot because it is running right now.** The
sentinel does not stop the tick: `reconcile-graph-merged` is in the drain on
every tick, and PR5's base-pin unit prevents a concurrently landed write being
clobbered — a live risk precisely because `main` is still moving under the
window. PR5 reads as pure efficiency work for a paused system and is not.

PR5 absorbs #3002 and the already-landed half of #3064. Its conflict-lane unit
must be coordinated with #3018's conflict-lane work, now in PR8 — **one policy,
not two**. **No author gate.**

### Position 5 · Bundle 4 — PR3 + PR4, instrument and finding surface

16 nodes. COLD in itself, but it comes before Bundle 3 because positions 6 and 8
both depend on it.

**PR4** retires the ledger primitive: a doctrine change with a 40-node data
migration and five writers collapsing into one write surface. That surface is
what PR19 writes supersession edges through, which is the hard edge into
position 6. **PR3** repairs the audit instrument's residual lenses and
measurement blind spots — and most of it may be a bookkeeping pass rather than
an implementation, because the graph says four of its nodes are open and the
code says otherwise. **Verify every "missing" claim before implementing.**

**No author gate**, but PR3 is what makes the two RSI measurement sessions
readable, so run `/rsi-audit 7d` for a baseline before changing anything.

### Position 6 · Bundle 2b — PR19, supersession representation

3 nodes: `schema.ts` (`superseded_by` + terminal), `/align-tactics` drops,
`lint-verify-fence-paths.sh`.

Pinned behind PR4 by a real `blocked_by` edge —
`tactic-persist-greenfield-drops` is blocked by
`tactic-finding-search-all-producers`, PR4's central node, because supersession
edges are written *by* that write surface.

**Gate: B1**, and it is the most consequential gate on the agenda. This PR
encodes two sub-points **Claude derived, not the author** — that in-flight nodes
get a supersession edge but no park, and that only a fully superseded node is
parked. Schema encoding is data; unwinding it later is a migration, not an edit.

Absorbs #3041 directly. **Keep #3093, #2856 and #3040 out** — they rewrite node
content in bulk and belong in position 12, after the bookkeeping.

### Position 7 · Bundle 3 — dispatch runtime

25 nodes: PR2's remainder, PR6, PR7, PR8 Units 1–2, PR9's remainder.

Deliberately large. Nothing invokes any of it while paused, so the cost of
bundling is not a broken window — it is that the first fleet start after
resumption becomes a single pass/fail boolean. **Mitigate with the staged
resumption, not by splitting**: that converts the boolean into a diagnosable
test and is worth more than any split.

**Gate: B2** (PR6, detached code-review locking). The live contradiction there
is worth carrying into the sitting: the flock shipped in #3078, yet
`tactic-eval-finding-detached-code-review-dies-with-launcher` shows the detached
child dies with its launcher despite `setsid`. A lock held by a process that
dies with its launcher is not a lock.

PR8 Unit 1 is more urgent than its position suggests — the pace-curve config is
untracked and unrecoverable.

### Position 8 · Bundle 5 — the RSI chain

10 nodes: PR10 (trigger chain) + PR11 (lens catalog decomposition) + PR12
(intervention core) + PR14 (prioritization and research lane).

**Two gates. A1** ratifies the band derivation whose thresholds PR10 writes into
config — and the searching sub-point is that under `band = resolved rank`, the
cross-strategy inversion count in `success_signal` (b) is structurally zero by
construction, i.e. unfalsifiable. **B3** verifies `tradition-agentic-engineering`
before PR11 encodes it — though B3's own node recommends waiting until two or
three `/rsi-research` cycles have landed readings, so sitting it early reviews
the record against nothing.

PR11 also needs `/rsi-audit 14d` first: the catalog declares a `model:` per lens
and both imported fan-out/model-routing findings were measured on configurations
this repo does not run. **Measure before fixing the values.**

### Position 9 · Bundle 5b — PR20, the `/align` charter and adversarial review

8 nodes; a new `/align-review` skill plus `assemble-review-pack`,
`graph-commit --review`, `/align` and `/align-tactics` skill text, and a
`validate-graph` lint.

**Gate: D1** — the `/align-audit` disposition. Note that D1 is not an open
question so much as an owed disposition: all three of its decisions are verified
landed, and what remains is a prune call plus an untracked residue no node
tracks. **D1 is itself blocked by A3**, and **A2 must precede D1** — splitting
the strategy re-cuts the denominator D1's park reads.

### Position 10 · Bundle 6 — PR13, the skill rename

1 node, repo-wide. **Last and alone**, and the ordering against position 9 is
not a preference: PR20 edits `.claude/skills/align-tactics/SKILL.md` and PR13
renames that skill to `/dispatch-plan`. Running them in the other order orphans
every path PR20 writes — the same failure this repo has already hit once, where
a rename left `verify` fences pointing at a deleted skill. **The violation is
silent, not a merge conflict**, which is what makes it dangerous.

Absorbs #2946's contested half: it edits eight skill bodies, every one of which
this PR renames by path. Sequence
`tactic-legacy-office-hours-entry-removal` *after* this PR — it moves anchors
under PR9, PR16 and PR20 at once. **No author gate.**

### Position 11 · Bundle 7 — PR17, merge queue and scan cadence

6 nodes: `graph-auto-merge`, `hold-alerts.ts`, `graph-digest.ts`, scratch refs.

**The only bundle whose position is set by the resumption rather than by
dependencies.** Everything in it is dormant while the sentinel holds, and it
must be in place before the staged resumption — otherwise that resumption
measures an unbounded scan cadence and a silent merge veto instead of measuring
the fleet.

**No author gate.** *(Corrected 2026-08-28.)* This position was listed as gated
on **C3** and **C4**, on the belief that they were PR17's Units 4 and 5. They are
not: PR17's Unit 4 is "cap the alert rows" and its Unit 5 is "stop leaking
scratch refs". C3 and C4 are **PR18** Units 4 and 5, so they gate **position 1**
— see that position. Both were ruled 2026-08-28, and both *do* have parked nodes,
contrary to the earlier "no node" claim.

### Position 12 · Bundle 8 — the four deferred A3 drafts

#3093 → #2856 → #3040 → #3037, **in that order**. All four are bulk
node-content rewrites, which is why they are last: each one invalidates every
`--base` CAS manifest, so any node bookkeeping still in flight would have to be
re-derived. #3037 also still edits `graph-commit` (+12/−5) — but landing here
means **#3037 rebases over PR15**, not the reverse, so PR15's anchors are
stable. **No author gate.**

### Then: the staged resumption

Not a midpoint. Per ground rule 4 it happens only after the last PR above has
merged and its nodes are closed, so **no bundle may be sequenced against it**.
Remove the sentinel with `max_concurrent_workers: 1`, walk one node through the
full ladder, and only then restore normal concurrency.

**PR8 Unit 3 stays deferred past even that.** It replaces the pause sentinel
with a config field — it rewrites the mechanism enforcing the freeze while the
freeze depends on it. Land it during a deliberate, attended un-pause, never
mid-window.

## The orderings that are not preferences

Most of the sequence can flex — Bundles 3 and 4 can swap or overlap, since they
share no files, and PR2 and PR5–PR9 are mutually independent. Five constraints
cannot:

1. **PR20 before PR13** (position 9 before 10). A rename orphans the paths the
   other PR writes, silently.
2. **PR4 before PR19** (position 5 before 6). A real `blocked_by` edge, and
   supersession edges are written by PR4's surface.
3. **PR5a before Bundle 2** (position 3 before 4).
4. **PR17 before the resumption** (position 11, last but one). Otherwise the
   resumption measures the wrong thing.
5. **Bundle 8 after all node bookkeeping** (position 12). Bulk content rewrites
   invalidate every CAS manifest.

And within Part I: **A2 before D1**, and **B1 before position 6 opens**.

## What this sequence does not cover

- **Six deferred nodes**, with reasons: the ref-split cluster
  (`tactic-graph-ref-split`, `-blocker-audit`, `-read-coherence`),
  `tactic-node-scope-files-overlap-gate` and `tactic-scope-stamp-in-graph`
  (both need a running fleet, i.e. resumption work), and
  `tactic-demote-node-stale-local-read` (blocked behind
  `tactic-phase-evidence-fingerprint-bound`).
- **Five adjacent nodes, surveyed and deliberately not claimed** —
  `tactic-qa-main-node-terminal-declaration` and the two
  `tactic-invalid-state-rc-*` nodes are `/qa-main` node-lane paths that write
  job-dir markers instead of graph state; `/qa-main` does not run while the
  sentinel holds and they overlap PR12's surface. Plus
  `tactic-session-reap-authorization-durability` and
  `tactic-park-cause-sensor-instrument`, which need a running fleet.
- **Eleven documented-but-unassigned tactics** from the third coverage pass.

## One caveat that applies to the whole sequence

The plan's `phase: null` re-verification **expired on 2026-08-20, in both
directions.** Inward: 45 of the 102 node ids in its `### Nodes closed` sections
are now `phase: implement` on `origin/main`, moved by `/align-tactics`
finalization rounds run after the plan was written. Nothing about the
assignments changed — but *"these nodes are not in the ladder"* is no longer
true of the phase field, **and the tick reads the phase field**. Outward: the
same filter is why the plan never saw the ~20 in-charter nodes at
`phase: implement` with no PR.

Treat every `path:line` anchor in the source plan as a hint, not an address —
including the anchors carried in node bodies, several of which had already
drifted when the plan was written.
