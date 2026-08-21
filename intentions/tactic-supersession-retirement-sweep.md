---
id: tactic-supersession-retirement-sweep
kind: tactic
statement: Widen lint-verify-fence-paths.sh from verify fences to body prose,
  and add a park lane, so open nodes whose plans name a deleted skill or script
  are caught at the commit that deletes it
owner: ai
status: raw
parent: null
rationale: "Ruled 2026-08-14; mechanism corrected 2026-08-15 by the pre-commit
  adversarial review. A creation-time check keyed on the new node can only find
  cases where the NEW node is the superseder; it is structurally blind to
  supersessions that already happened. Live proof: tactic-node-ancestry-context
  sat at phase implement with a plan targeting
  .claude/skills/align-strategy/SKILL.md, deleted 2026-08-04, and was
  unexecutable. The 2026-08-14 draft specified a NEW deletion-event sweep and
  claimed no instrument existed for this class; that was false.
  lint-verify-fence-paths.sh already ships and already runs in CI on every
  commit, and missed the proof case only because its scan window is fence-scoped
  rather than body-scoped. This node is now that widening."
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
  reason: >-
    SIDE A — MAJOR SCOPE DEVIATION. The serving strategy's ARMED
    maintenance-burden band condition FAILS on both limbs, so this per-node
    finalize would plan against a dead premise. A tactic-target session never
    writes the serving strategy, so the fact is recorded here on the target; the
    decision it needs is the author's, on the strategy.


    MEASURED THIS ROUND at origin/main 53eefa33 (2026-08-21), using the
    canonical formula verbatim (strategyBacklogBand / classifyTactic,
    packages/intentionsutil/src/census.ts:13-40). The align-tactics-census.ts
    wrapper could not run in-sandbox (tsx fails `listen EPERM` on its IPC pipe),
    so the classification was re-derived directly over intentions/*.md
    frontmatter — TWICE and INDEPENDENTLY, once by the drift agent and once by
    the caller thread, agreeing exactly: 315 tactics serve
    strategy-graph-native-dispatch — 83 open (phase set, not done: 48 implement,
    22 main-qa, 13 qa), 41 born-parked (phase null with office_hours set), 94
    pure draft, 97 done. Backlog = (83+41)/315 = 39.4%, ABOVE the
    author-declared <=35% ceiling.


    LIMB TWO ALSO FAILS: the strategy's own recorded series is 47.6% -> 38.2% ->
    31.4% -> 24.6% (reading dated 2026-08-10, 58/236), so 24.6% -> 39.4%
    REVERSES the required non-increasing trend. This corroborates, on a fresh
    count and one commit later, the same measurement made hours earlier by the
    sibling round that parked tactic-graph-commit-park-content-durability (38.5%
    at fd98fd26), whose run validated the formula by reproducing the 2026-08-10
    sample 58/236 = 24.6% exactly — so the comparison is apples-to-apples. The
    strategy's `reading`/`gap` snapshot is stale, not still-passing.


    The condition declares its own consequence in terms: a burden growing
    without bound is the condition FAILING, which parks for an author decision,
    not merely more work to do. Finalizing this node would also worsen the very
    ratio it fails on: this node is phase null with office_hours null, i.e.
    denominator-only `draft` today; a finalize moves it into the `open`
    numerator, taking the band to 125/315 = 39.7%. Only reaching phase done
    reduces it.


    NOTHING ELSE BLOCKS THIS NODE — this park is about the strategy's band, not
    about this record. The plan is otherwise authorable, and that was verified
    rather than assumed: the doctrine home (clarification 248) is ruled and
    internally consistent; the shipped instrument this node widens exists and is
    wired unconditionally into CI (lint-verify-fence-paths.sh, called at
    run-lint.sh:154-159); this node's own 2026-08-15 corrections are true
    against current source (tactic-align-tactics-mechanical-floor is phase done
    and correctly withdrawn as evidence; the blocked_by on
    tactic-supersession-edge-and-terminal is correctly dropped, since a park
    writes only office_hours and needs no schema change); and the live proof
    case still holds (tactic-node-ancestry-context, phase implement, names
    `.claude/skills/align-strategy/SKILL.md` at lines 40 and 481, and that skill
    is confirmed absent from disk).


    ALSO MEASURED THIS ROUND, and good news for whoever resumes it: the widening
    works and is precise. A prototype prose pass (backticked tokens matching
    `^(\.claude|packages)/`, then the SAME `-e` + `EVER` gates the shipped lint
    already applies) over all 586 non-`done` nodes produced 28 hits across 24
    distinct nodes, every one hand-verified a genuine orphan — ZERO false
    positives — and it catches the proof case. Deleting commits: c845d50f
    2026-08-04 (align consolidation, 9 hits), c3c229f0 2026-08-12 (token-audit
    retirement, 8 hits), edc11dc4 2026-08-04 (packages/intentionsutil/SCHEMA.md,
    5 hits), 0eb87735 2026-07-14 (1 hit). Two consequences the resumed round
    must plan for, not re-derive: the baseline ships `[]` and its header says it
    must not grow, so 28 pre-existing violations must be swept or grandfathered
    in the same change; and one of the 28 sits on strategy-graph-native-dispatch
    ITSELF, so the park lane must be fenced to `kind: tactic`.


    No Side B material premise was found. Three immaterial Side-B observations
    are carried on tactic-supersession-retirement-sweep-drift-observations
    (minted in this same commit) — they gate nothing here, and clarification 245
    / V1 forbids an autonomous lane writing them to the serving strategy's
    clarifications.
  since: 2026-08-21
  recommendation: >-
    Two steps, in order.


    (1) RULE ON THE BAND — this is the whole blocker and it is a strategy-level
    decision, not this node's. Three routes: (a) re-declare the band at a level
    the corpus supports; (b) re-scope its FORMULA, which this round's corpus
    scan suggests is the substantive option — 41 of the 124 backlog nodes are
    born-parked office_hours carriers, and a large share of those are
    `-drift-observations` immaterial-drift carriers that are structurally
    always-parked BY DESIGN rather than defect backlog, so the numerator counts
    as machinery defects a population the doctrine deliberately creates; and 97
    `done` tactics remain unpruned, so the denominator is itself uncertain; (c)
    accept the failure as read and decide what stops.


    (2) IF THE BAND IS CLEARED, re-run `/align-tactics
    tactic-supersession-retirement-sweep` unchanged. No other blocker was found,
    and this round's measurements (the 28-hit precision result, the deleting
    commits, the baseline-rollout consequence, the strategy-node hit) are
    recorded in the park reason above and in the observation carrier so the
    resumed round does not pay for them again.


    RULE IT ONCE, NOT NODE BY NODE. The identical blocker is already recorded on
    tactic-graph-commit-park-content-durability (parked hours earlier at 38.5%).
    Every remaining per-node /align-tactics round on this strategy will
    re-derive the same failure and park on it, so the band decision is worth
    taking as one sitting covering the whole strategy rather than per node.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Widen lint-verify-fence-paths.sh from verify fences to body prose, and add a park lane

## Draft context (2026-08-14 /align correction round, mechanism corrected 2026-08-15)

Doctrine home: `strategy-graph-native-dispatch`, the clarification "A
creation-time supersession check keyed on the new node cannot find supersessions
that already happened."

### The structural hole

The creation-time check is keyed on the **new** node, which bounds its blast
radius to one search per creation — that is what makes it affordable. The price
is that it can only find cases where the NEW node is the superseder. A node that
landed months ago and quietly obsoleted an open node is invisible to it forever.
The check measures precision, not recall.

### Build on the instrument that already ships

**Read this before designing anything.**
`.claude/skills/dispatch-propagate/scripts/lint-verify-fence-paths.sh` exists,
and `.claude/skills/dispatch-propagate/scripts/run-lint.sh` calls it
**unconditionally**, so it is already in CI on every commit. Its contract: fail
at the commit that orphans a fence-named path — for every non-`done` node it
extracts the ```verify blocks and asserts that every path-like token in them
still exists. It already has the trigger, the CI wiring, the `done`-node
exclusion, a token rule tuned against false positives, and a test suite
(`test-lint-verify-fence-paths.sh`).

**Why it missed the proof case, measured:** the dead reference in
`tactic-node-ancestry-context` is in a prose Scope bullet; that node's ```verify
fences begin hundreds of lines later. The lint's scan window is fence-scoped.

The 2026-08-14 draft recorded that the proof case was found "not by any
instrument" and specified a parallel sweep fired by deletion events. Both were
wrong: the instrument exists, and **nothing in this repository emits a deletion
event** — which the shipped guard sidesteps by running on every commit instead.
Minting a second scanner would have given the repo two notions of a stale path.

### Scope

- **Unit A — widen the scan window.** Add a second pass over **non-fence body
  prose**, restricted to backticked path tokens under `.claude/**` and
  `packages/**`. Reuse the existing token rule rather than inventing a second
  one; it was already designed against false positives, and prose is noisier
  than a fence, so the restriction to backticked tokens is load-bearing.
- **Unit B — add a park lane.** Today a match only reddens CI. A match on an
  **open** node should also park it, with a recommendation naming what was
  deleted and when. Park only — it never closes, consistent with the ruled
  record-never-close-unattended disposition.
- Reuse `packages/intentionsutil/scripts/lib-deleted-node-ids.ts`, the existing
  git-derived deleted-set helper, generalized from node ids to file paths.
- Keep the `done`-node exclusion exactly as it is. See below.

### The `done`-node exclusion is deliberate — do not remove it

`done` bodies are historical archives by design and may legitimately name paths
that no longer exist; the shipped lint's header says so. The 2026-08-14 draft
named `tactic-align-tactics-mechanical-floor` as residue this sweep would
catch — it is at `phase: done`, so it is a case this sweep is built **not** to
touch. That citation is withdrawn. If stale references inside `done` bodies are
worth solving, that is a different instrument with a different rationale, and it
is not ruled here.

Residue that IS in scope and still open: `tactic-align-strategy-new-steps-revision`
(`phase: null`), scoped entirely to editing the deleted skill.

### No dependency on the schema change

The 2026-08-14 draft set `blocked_by: [tactic-supersession-edge-and-terminal]`
"for the edge it records alongside the park". **Removed 2026-08-15.** This node's
scope is park-only, and a park writes `office_hours` — no schema change is
required, so sequencing the one remediation with a proven live victim behind a
schema-plus-router change was unjustified. If a `superseded_by` write is wanted
alongside the park later, that is a follow-on unit and the dependency belongs on
the unit, not on the node.
