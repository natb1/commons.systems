---
id: tactic-supersession-retirement-sweep-drift-observations
kind: tactic
statement: "Observation carrier from the 2026-08-21 /align-tactics tactic-mode
  round on tactic-supersession-retirement-sweep: the target draft cites the
  wrong deleted-set helper when the shipped lint already computes one, the
  empty-and-test-pinned baseline makes the widening redden main at its own
  landing commit, and the park half cannot share the CI lint’s execution context
  because that runs on a PR branch"
owner: human
status: delegated
parent: null
rationale: Minted 2026-08-21 by the /align-tactics tactic-mode round targeting
  tactic-supersession-retirement-sweep. That round parked on Side A (the serving
  strategy’s armed maintenance-burden band fails on both limbs) and authored no
  plan; its Side-B review found no material premise but did surface three
  immaterial observations. Under clarification 245 / V1 an autonomous lane may
  not land these as dated clarifications on the serving strategy, and under
  references/tactic-target.md a per-node session never edits the serving
  strategy at all — so a born-parked observation node serving the strategy is
  the one legal destination, the same shape /align mints for a deferral. All
  three are also restated inside the target node’s own park reason, so a resumed
  round gets them even without reading this carrier; this node exists so they
  are not lost if that park is cleared by a commit rather than read.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Observation carrier, not planned work — the three immaterial Side-B
    drift observations from the 2026-08-21 /align-tactics tactic-mode round on
    tactic-supersession-retirement-sweep that have no legal autonomous
    destination. Clarification 245 / V1 (which OVERTURNED clarification 118)
    forbids an autonomous lane writing these to the serving strategy's
    clarifications, and a tactic-target session never touches the serving
    strategy's frontmatter at all, so this node is their destination. None of
    the three gates that tactic's plan; that round parked on Side A (the
    strategy's maintenance-burden band) for an unrelated reason. (1) A REUSE
    CLAIM IN THE TARGET'S OWN BODY IS WRONG: it names
    packages/intentionsutil/scripts/lib-deleted-node-ids.ts as the reuse for the
    git-derived deleted set, but that file is TypeScript, returns NODE IDS, and
    is hardcoded to `-- intentions/`, while the lint is bash and ALREADY builds
    the generalized ever-existed-PATH set inline (its EVER map). The correct
    reuse is EVER; the cited helper is the wrong one. Not corrected in place
    because the target is a parked draft awaiting an author ruling. (2) A
    ROLLOUT HAZARD: verify-fence-path-baseline.json ships `[]` AND
    test-lint-verify-fence-paths.sh pins that emptiness by asserting `jq -r
    'length'` is 0. Widening the scan window surfaces 28 pre-existing violations
    at the landing commit, so the widening reddens main and breaks its own test
    unless it sweeps or grandfathers them in the same change. (3) AN
    EXECUTION-CONTEXT SEPARATION the ruled design does not state: run-lint.sh is
    invoked from a GitHub Actions PR job, so a park lane placed literally inside
    its unconditional verify-fence call would have a CI runner write
    office_hours to origin/main diagnosed off UNMERGED branch state. The two
    halves must be placed apart — CI keeps the red-CI half, a main-state tick
    sweep takes the park half. See the body for each observation in full, with
    measured anchors."
  since: 2026-08-21
  recommendation: >-
    Disposition per observation, not one for the node.


    (1) DROP AT NEXT FINALIZE — observation 1 is a correction to
    tactic-supersession-retirement-sweep's own draft body. The cheapest route is
    to let the resumed /align-tactics round absorb it (this round could not: it
    parked, and a parked draft awaiting an author ruling should not also be
    silently rewritten). No separate work item is needed; if the band ruling
    clears that node, this observation dies with the finalize.


    (2) and (3) CARRY INTO THE PLAN — both are design inputs the resumed round
    must honour, and both are already stated in that node's park reason as well,
    so they survive even if this carrier is never read. Nothing to rule; they
    need no author judgment.


    ONE THING THAT DOES WANT A HUMAN, recorded here because this round noticed
    it and had no other destination: this carrier is itself an instance of the
    population that pushed the band over its ceiling. Minting it moves the
    strategy from 124/315 = 39.4% to 125/316 = 39.6%. Observation carriers are
    born parked by design and never reach `done`, so the doctrine that created
    them guarantees a monotonically growing born-parked count inside the
    numerator of a band declared to measure machinery DEFECTS. That is worth
    ruling on together with the band decision on
    tactic-supersession-retirement-sweep — see route (b) in that node's
    recommendation.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Observation carrier — 2026-08-21 /align-tactics round on `tactic-supersession-retirement-sweep`

## What this node is

Not planned work. A **born-parked carrier** for the three immaterial Side-B
drift observations the 2026-08-21 `/align-tactics` tactic-mode round surfaced
while reviewing `tactic-supersession-retirement-sweep`. None of the three gates
that node's plan; the round parked for an unrelated Side-A reason (the serving
strategy's armed maintenance-burden band fails on both limbs) and authored no
plan at all.

Clarification 245 / V1 — which **OVERTURNED** clarification 118 — forbids an
autonomous lane writing observations like these to the serving strategy's
`clarifications`, and `references/tactic-target.md` forbids a per-node session
touching the serving strategy's frontmatter at all. A born-parked observation
node serving the strategy is the one legal destination.

All three are **also** restated inside `tactic-supersession-retirement-sweep`'s
own park reason. That redundancy is deliberate: an interactive commit touching
that node clears its park, and the park reason goes with it. This carrier is
where they survive.

Every anchor below was measured on 2026-08-21 against `origin/main` `53eefa33`.

---

## Observation 1 — the target draft cites the wrong deleted-set helper

`tactic-supersession-retirement-sweep`'s Scope section says:

> Reuse `packages/intentionsutil/scripts/lib-deleted-node-ids.ts`, the existing
> git-derived deleted-set helper, generalized from node ids to file paths.

**Measured: that is the wrong helper, and no generalization is needed.**

- `lib-deleted-node-ids.ts` is **TypeScript** (76 lines), exports
  `deletedNodeIds()`, is hardcoded to `-- intentions/`, and matches
  `^intentions/(.+)\.md$` — it returns **node ids**, not paths. The lint it
  would be reused from is **bash**, so calling it means a `tsx` subprocess
  inside a CI bash linter.
- `lint-verify-fence-paths.sh` **already computes exactly this set inline**: the
  `EVER` associative array (one bulk
  `git log --no-renames --diff-filter=AD --name-only`, ancestor-prefix expanded
  by `awk`) is the generalized ever-existed-**path** set, and it is built
  independently of which text is later scanned. A prose widening needs no second
  deleted-set helper; it reuses `EVER` unchanged and builds it exactly once, as
  today.

The reuses that **are** load-bearing for the widening, all inside that one file:
the token rule (quote/backtick strip, the `/`-and-no-`$*?{}()`-and-no-`://`
filter, the leading-segment check against `TOPLEVEL`, the trailing `:<line>`
anchor strip, the `EVER` existence gate, and `SEEN`/`BASELINE` keying); the
`done`-node exemption via `node_phase()`; and the `MAX_NODE_BYTES` cap, which
already bounds the **whole node file** rather than only the fence subset.

One further trap the widening must not fall into: `lib-verify-fence.sh`'s
`extract_verify_blocks` is **not** a generic prose walker — it hard-codes a
`^##\s+Verification` header regex and a `^verify\s*$` info-string filter. So
"non-fence body prose" must be derived as the **complement** of what that
parser captures, not by calling it.

**One thing `lib-deleted-node-ids.ts` does carry that is worth porting:** a
**shallow-clone guard**. It throws when `git rev-parse --is-shallow-repository`
is true, because a truncated history silently turns real orphans into invisible
ones. The shipped lint's `EVER` map has no such guard, so under a shallow CI
clone the widened scan would **fail open** — reporting a clean pass on a tree it
could not actually see.

**Why this was not fixed in place:** the target is a parked draft awaiting an
author ruling on the band. Silently rewriting a draft the same round just parked
would obscure what the author is being asked to rule on.

---

## Observation 2 — the baseline is empty *and test-pinned*, so the widening reddens main at its own landing commit

`.claude/skills/dispatch-propagate/scripts/verify-fence-path-baseline.json`
currently contains exactly `[]`. Its header in the lint states the intent
plainly — it ships empty because "a sibling unit swept every live violation
first", and it "must NOT grow: a newly orphaned fence path is a violation to
FIX, not a baseline entry to add".

Two facts make this a rollout hazard rather than a note:

1. **`test-lint-verify-fence-paths.sh` pins the emptiness** by asserting
   `jq -r 'length'` is `0`. So the widening does not merely redden main — it
   also fails its own suite unless that assertion is revisited deliberately.
2. **The widening surfaces 28 pre-existing violations immediately.** A prototype
   prose pass (backticked tokens matching `^(\.claude|packages)/`, then the same
   `-e` + `EVER` gates the shipped lint applies) over all **586 non-`done`
   nodes** produced **28 hits across 24 distinct nodes**, every one hand-verified
   a genuine orphan — **zero false positives**:

   | orphaned path(s) | deleted at | date | hits |
   | --- | --- | --- | ---: |
   | `.claude/skills/align-strategy/SKILL.md`, `.claude/skills/align-init/**` | `c845d50f` | 2026-08-04 | 9 |
   | `.claude/skills/dispatch-token-audit/**`, `packages/intentionsutil/scripts/render-rsi-plan.ts`, `.claude/skills/rsi/scripts/test-rsi-claim.sh` | `c3c229f0` | 2026-08-12 | 8 |
   | `packages/intentionsutil/SCHEMA.md` | `edc11dc4` | 2026-08-04 | 5 |
   | `.claude/workflows/dispatch-graph-tick.js` | `0eb87735` | 2026-07-14 | 1 |

So the widening must **either** sweep those 28 references first (the pattern the
header itself describes) **or** seed/extend the baseline — or add a second,
independently grandfathered baseline file — in the same change. It cannot land
as a scan-window change alone.

**A detail the resumed round should not miss:** one of the 28 hits is on
**`strategy-graph-native-dispatch` itself**, a durable-layer node. The widened
scan therefore fires on non-tactics, so the park lane must be **fenced to
`kind: tactic`** — consistent with clarification 245's V2 ruling that a
mechanical check, not a prompt, must refuse a durable-layer write.

A second detail, measured: `intentions/tactic-review-verify-per-file-batching.md`
contains a **NUL byte**, so `grep` reports "binary file matches" on it. The
shipped lint already handles this with `body="$(tr -d '\0' < "$file")"`. A new
prose pass that reads the file any other way will silently skip that node.

---

## Observation 3 — the park half cannot share the CI lint's execution context

The ruled design (clarification 248) says to widen the lint **and** add a park
lane. The two halves cannot live in the same place, and the record does not say
so.

- `run-lint.sh` is invoked from a **GitHub Actions PR job**
  (`.github/workflows/unit-tests.yml`), and its verify-fence-path call is
  deliberately **unconditional**.
- `park-node` **pushes to `origin/main`** through `graph-commit`'s landing lock.

A park lane placed literally inside that call would therefore have a CI runner
write `office_hours` to `origin/main` **diagnosed off unmerged branch state** — a
path deletion still on a feature branch would park a live node against `main`,
and would do so on every PR that touches it. The strategy's own
fresh-`origin/main`-read condition points the two halves apart.

**The split, and the template for the park half.** CI keeps the red-CI half
exactly as it is today. The park half rides a **main-state sweep on the tick
cadence**, for which the corpus already supplies a working template:
`.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh`. It already
solves every problem this park lane has —

- a **park cap** via env override, because (its own header) "`park-node` pushes
  to `main` through `graph-commit`'s landing lock, so an unbounded batch would
  serialize N pushes inside one tick";
- an **already-parked skip** read fresh from `origin/main:intentions/<id>.md`;
- a **post-park landed-confirmation** re-read, because "`graph-commit` exit 0 is
  not evidence a write landed";
- one greppable decision line per node per pass plus exactly one summary line;
- a **never-a-gate, always-return-0** posture.

Place it where `dispatch-tick` places that sweep — **before target selection**,
so a node parked this tick is excluded from the same tick's selection.

The park itself must call `packages/intentionsutil/scripts/park-node` rather
than hand-rolling an `office_hours` write, and must honour the ruled
**park-collision discipline**: `office_hours` is single-valued, so an
already-parked node's reason is **UPDATED to carry both causes, never
clobbered** (clarification 239). This matters concretely here — the proof case
`tactic-node-ancestry-context` is **already parked**, so it is the first node
this lane would meet.

---

## One thing that wants a human — this carrier is its own example

Minting this node moves the serving strategy's maintenance-burden band from
**124/315 = 39.4%** to **125/316 = 39.6%**.

Observation carriers are born parked by design and never reach `done`. So the
doctrine that creates them guarantees a monotonically growing born-parked count
inside the **numerator** of a band declared to measure machinery **defects** —
41 of the 124 backlog nodes are born-parked `office_hours` carriers today, a
substantial share of them `-drift-observations` nodes exactly like this one.
Meanwhile 97 `done` tactics remain unpruned, so the **denominator** is uncertain
too.

That is not an argument for dropping the observations. It is an argument that
the band's formula, not only its level, is what wants ruling — and it should be
ruled **together with** the band decision recorded on
`tactic-supersession-retirement-sweep`, not separately.

---

## Provenance

Minted 2026-08-21 by the `/align-tactics` tactic-mode round targeting
`tactic-supersession-retirement-sweep`, at `origin/main` `53eefa33`. That round
returned `disposition: escalated`, `drift.proceed: false`, zero plans, and one
park (Side A, category `major-scope-deviation`). These three observations are
its complete Side-B immaterial output; it found **no** Side-B material premise.
