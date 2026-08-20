---
id: tactic-graph-refsplit-blocker-audit
kind: tactic
statement: Determine whether tactic-graph-ref-split's 37 blockers encode real
  dependencies or a quiescence requirement that never converges — and if the
  latter, what makes its cutover incremental instead of one-sitting
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-08-14 /align round (strategy clarification
  237). ref-split is phase:implement with 37 blockers, 23 still open as of
  2026-08-14, and a cutover procedure that forbids phase handoff — Units 1-8
  through to merge in one sitting or do not start, because between main losing
  intentions/ and every worktree gaining the symlink the graph tooling that
  drives the handoff is itself broken. The blocker list reads as breadth-wide
  quiescence rather than mechanism dependency, and the fleet keeps minting
  tactics, so the set may never converge. Recorded explicitly as INFERENCE from
  the list's breadth: the blockers were not read individually this round. That
  verification is this tactic's first unit."
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
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Determine whether tactic-graph-ref-split's 37 blockers encode real dependencies or a quiescence requirement that never converges — and if the latter, what makes its cutover incremental instead of one-sitting

Draft retained from the 2026-08-14 `/align` round. Not a plan.

## What was measured, and what was only inferred

**Measured 2026-08-14** against `origin/main` — every blocker's `phase:` field read
directly: 37 blockers, **14 done, 23 open, 0 missing/pruned**. The 23 open, by
phase:

- `implement` (11): `attention-surface-instrument`, `demo-saas-acceptance`,
  `legacy-office-hours-entry-removal`, `mount-schema`, `nix-clean-system-drill`,
  `node-ancestry-context`, `office-hours-graph-read-cwd-whitespace`,
  `omit-default-serialization`, `preview-deploy-on-demand`,
  `realignment-coverage-sensor`, `schema-drift-guard`
- `main-qa` (7): `align-tactics-tactic-mode-drift-gate`,
  `dependency-justification-audit`, `graph-commit-delete-vs-edit-park-hardening`,
  `graph-tick-node-lane-auto-merge`, `manual-path-reservation-sweep`,
  `office-hours-drain-claim`, `office-hours-select-fresh-main`
- `qa` (4): `census-scripted-tick`, `tactic-delegation-classification-derivation`,
  `phase-evidence-fingerprint-bound`, `scope-fingerprint-plan-substance`
- `review` (1): `clarification-citation-ids`

**Inferred, not verified.** That this set encodes *quiescence* ("nothing may be in
flight during the cutover") rather than *mechanism dependency* ("ref-split's design
needs this to exist first") is read from the breadth of the list — `demo-saas-acceptance`,
`nix-clean-system-drill` and `preview-deploy-on-demand` have no obvious relation to
the graph store's ref layout. **The blockers were not read individually.** Verifying
that classification, per blocker, is this tactic's first unit. It may be wrong.

## Why the answer matters

`tactic-graph-ref-split`'s own cutover procedure states the constraint that makes
the blocker set decisive:

> **This node does not hand off between phases.** [...] between the moment `main`
> loses `intentions/` (Unit 8) and the moment every worktree has the `intentions`
> symlink, the graph tooling that drives the handoff is itself broken. A session
> that stops halfway leaves the fleet unable to read its own queue, and the recovery
> path (`park-node`, `office-hours-graph`) is part of what is broken. So the
> implementing session runs Units 1-8 through to merge in one sitting, or it does
> not start.

If the blockers are a quiescence requirement, they are a moving target: the fleet
mints tactics continuously, so the set may never reach zero, and the ratified
greenfield would be permanently unreachable while its interim
(`tactic-graph-commit-landing-lock`, explicitly "deleted when the ref split lands")
becomes permanent. If they are real dependencies, the count is simply progress and
nothing structural is wrong.

## The second question, only if the first answers "quiescence"

What makes the cutover incremental? The one-sitting constraint comes from a window
where `main` has lost `intentions/` but worktrees lack the symlink. Candidate
framings worth testing — none evaluated this round:

- install the symlink everywhere **first**, pointing at a `GRAPH_WT` seeded from a
  `graph-main` that is still a mirror of `main`'s `intentions/`, so no window exists;
- dual-write to `main` and `graph-main` through the cutover, making Unit 8 a
  no-reader-affecting deletion;
- keep `intentions/` on `main` permanently and take only the writer/ref changes —
  which raises the question of what the split still buys once the CI stamp is gone.

Note the interaction with `tactic-graph-commit-plumbing-default`: if the plumbing
default flips first, the stamp cost that motivated the split in the first place
(clarification 80) is unchanged — the scratch-branch CI stamp is a `main` branch-
protection cost, not a writer cost — so that flip does **not** subsume this.

## Disposition — 2026-08-14 (decision session, read-only, no diff)

This section closes the tactic's first unit: the per-blocker classification the
`rationale` recorded explicitly as INFERENCE. All 37 blockers were read
individually against `origin/main` at `da1c3c7f`.

### Q1 — real dependencies, or quiescence? **Quiescence. Measured.**

The counts stand as the section above recorded them (14 `done`, 23 open, 0
missing). What is new is that each open blocker's *relation to the ref layout*
is now classified rather than inferred from the list's breadth.

**8 of the 23 open blockers have a mechanism relation:**

| Blocker | Mechanism relation |
|---|---|
| `tactic-omit-default-serialization` | rewrites every node file — collides directly with Unit 1's `git subtree split --prefix=intentions`, whose output tree root *is* the node-file directory |
| `tactic-graph-commit-delete-vs-edit-park-hardening` | edits `graph-commit`, the exact file Unit 2 rewrites wholesale |
| `tactic-office-hours-select-fresh-main` | reads the very ref that moves |
| `tactic-graph-tick-node-lane-auto-merge` | batched `graph-commit` invocation |
| `tactic-census-scripted-tick` | batched `graph-commit` invocation |
| `tactic-realignment-coverage-sensor` | edits `read-sensors.ts` and `validate-graph.ts` — Unit 5's repointing surface |
| `tactic-schema-drift-guard` | edits `read-sensors.ts` and `validate-graph.ts` — same |
| `tactic-attention-surface-instrument` | edits `read-sensors.ts` — same |

(The decision session's first pass estimated "about 6". The figure is **8**: the
five `graph-commit`/ref-reading nodes plus three that edit the sensor scripts
Unit 5 repoints. Unit 5's surface is the *scripts* `read-sensors.ts` and
`lib-deleted-node-ids.ts`, not sensor *nodes* — the three above were found by
grepping the open blockers for those script paths.)

**The remaining 15 have no relation to the ref layout at all** beyond "must not
be in flight during a one-sitting cutover" — `tactic-demo-saas-acceptance`,
`tactic-nix-clean-system-drill`, `tactic-preview-deploy-on-demand`,
`tactic-mount-schema`, `tactic-dependency-justification-audit`, and the rest.
Nothing in ref-split's design needs any of them to exist first; they are on the
list because the cutover cannot tolerate concurrent work, which is a property of
the *procedure*, not of the design.

**So the `rationale`'s inference is CONFIRMED**, and with it the concern that
follows from it: the set is a moving target. The fleet mints tactics
continuously, so a blocker list whose membership rule is "nothing may be in
flight" never converges, and the ratified greenfield stays permanently
unreachable while its interim (`tactic-graph-commit-landing-lock`, explicitly
"deleted when the ref split lands") becomes permanent.

### Q2 — what makes the cutover incremental?

**The first candidate framing listed above is the right one**, and it dissolves
the constraint rather than working around it:

Seed `graph-main` as a mirror of `main:intentions/` and install the `intentions`
symlink everywhere **while `main` still carries the directory**. At no point is
there a window in which a reader is broken — during the transition both paths
resolve to the same content. Unit 8's deletion of `main:intentions/` then becomes
a final step that affects no reader, because every reader is already going
through the symlink.

That removes the one-sitting constraint, and with it the reason 15 of the 23
open blockers are on the list at all. The blocker set should be **re-cut** to the
8 mechanism-related nodes rather than waited out.

### Disposition: **(b) DEFER — ref-split does not land before Bundle 1**

With a rider: its blocker set should be re-cut per Q2 rather than waited out,
since the fleet mints tactics continuously and the set never converges on its
current membership rule.

`tactic-graph-refsplit-read-coherence` stays parked with it.

---

## Correction — the serialized PR plan's exposure claim is wrong

`plans/dispatch-rsi-serialized-pr-plan.md` states, under PR1's Dependencies,
that PR1 "Units 1–4 repair the CI-stamp/scratch-branch write mechanic that
ref-split replaces" and that "Units 5–8 survive either way". Read against
ref-split's own Unit 2 (`intentions/tactic-graph-ref-split.md`, the
delete-entirely and keep-unchanged lists), that split is **not** where the
exposure actually falls:

| PR1 unit | Under ref-split | Evidence in `tactic-graph-ref-split.md` |
|---|---|---|
| U1 far-ahead rebuild / `noop` | **deleted** | `ensure_intentions_only_base()` is on the delete-entirely list — "the far-ahead-worktree rebuild hazard this exists for is structurally impossible once landing never touches a worktree's checkout" |
| U2 sensor-validator scope + PR CI | **survives, and becomes more load-bearing** | Unit 2 step 5 makes `validate-graph.ts` the *sole* push gate, replacing `.github/workflows/graph-fast-path.yml`'s guard job |
| U3 prose refs vs the batch | **survives** | pure `schema.ts`; ref-independent |
| U4 fixture graph | **survives, and helps** | makes the CLI suite ref-independent instead of `origin/main`-coupled |
| U5 ORPHANED rc split | **deleted** | `await_checks` and its `CHECK_POLL_SECONDS`/`CHECK_TIMEOUT_SECONDS` globals are on the delete-entirely list |
| U6 `SNAP_DIR` immutability | **survives; is a prerequisite** | `snapshot()` is on the keep-unchanged list as "still the sole surviving copy of a writer's content on the fail-closed park path" — which is exactly the property U6 makes true |
| U7 npx park storm | **survives, reduced** | the `ensure_intentions_only_base` caller goes; the `check_base_freshness` call sites remain |
| U8 explicit ref on reads | **survives; is a prerequisite** | Unit 2 step 5 invokes `validate-graph.ts <tmp>` with an explicit directory argument |

So the real exposure is **U1 and U5 only** — not Units 1–4 — and three units
(U2, U6, U8) are things ref-split *needs to exist first*. PR1 proceeds with all
8 units under either disposition.

**PR15 is the PR genuinely at risk**: its Units 1–2 are subsumed by ref-split's
Unit 2 rewrite. Do not start PR15 before revisiting this disposition.

### Consequence accepted deliberately

U1 and U5 are implemented anyway, under DEFER, as a recorded accepted cost. U1
is the highest-severity item in PR1 — silent loss of a node edit, armed by any
unpushed local commit on `main` — and every one of the ~94 node closures the
serialized PR plan prescribes runs through that writer. Leaving it unfixed for
the length of the window is worse than the rework risk, and the rework risk is
bounded: if ref-split ever lands, this code is *deleted*, not migrated, so
nothing has to be re-derived.
