---
id: tactic-qa-fix-terminal-marker-ratchet
kind: tactic
statement: Add test-qa-fix-terminal-marker.sh, a doctrine ratchet over /qa-fix's
  fix-finalize node-terminal declaration and its ordering constraint, so the
  guard that today exists only as prose in two drifting files is mechanically
  pinned the way the equivalent align-tactics declaration already is
owner: ai
status: raw
parent: null
rationale: "An asymmetry found 2026-08-13 while recording PR #3073's graph
  writes. The /qa-fix fix-finalize declaration gap was a live production
  failure: the path called only dispatch-mark-complete --phase qa and declared
  nothing, so dispatch-self-close --node never saw the node-terminal marker it
  requires before reaping, the job stayed HELD and the node stayed claimed --
  confirmed live on PR #2985. Commit 2f4a9b5f (PR #2986) fixed it by inserting
  `mark-node-terminal \"$N\" fix-attempt` into references/auto-fix-lane.md and
  its condensed SKILL.md mirror, and touched seven files in prose with no bash
  test at all. The structurally identical align-tactics declaration, fixed by
  tactic-align-tactics-mark-terminal-skipped, IS pinned:
  test-align-tactics-terminal-marker.sh asserts each requirement as its own row
  (including :85, that SKILL.md carries no standalone align-round marker call,
  and :101, that it STILL carries the exit-12 no-claim call -- asserted
  alongside so the ratchet cannot be satisfied by deleting the wrong call),
  wired into CI at unit-tests.yml:233-234. So one instance of a defect class is
  ratcheted and the other, whose failure was actually observed in production, is
  defended by prose in two files that must stay in sync by hand. The regression
  is silent in the worst way: a dropped marker does not fail any test, it wedges
  a job. Note the fixes are not symmetric in kind and the ratchet must respect
  that -- align-tactics closed its gap STRUCTURALLY, by moving the marker write
  into land-align-round so it happens in the same process as the land, while
  qa-fix's fix-finalize marker remains a prose instruction to the model, which
  is precisely why it needs the prose ratchet more, not less."
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
# Add test-qa-fix-terminal-marker.sh, a doctrine ratchet over /qa-fix's fix-finalize node-terminal declaration and its ordering constraint, so the guard that today exists only as prose in two drifting files is mechanically pinned the way the equivalent align-tactics declaration already is

## The asymmetry

Two instances of one defect class. Only one is ratcheted, and it is not the one
whose failure was observed in production.

| | `/align-tactics` align-round marker | `/qa-fix` fix-finalize marker |
|---|---|---|
| Failure | round landed, no disposition, node parked by the sweep (3× in production) | job stayed HELD, node stayed claimed (live on PR #2985) |
| Fixed by | `tactic-align-tactics-mark-terminal-skipped` | `2f4a9b5f` (PR #2986) |
| How | **structurally** — `land-align-round` writes the marker in the same process as the land | **in prose** — an instruction inserted into two skill files |
| Pinned by | `test-align-tactics-terminal-marker.sh`, CI at `unit-tests.yml:233-234` | nothing |

`2f4a9b5f` touched seven files and added no bash test.

## Why the unratcheted one is the more fragile of the two

The two fixes are not symmetric in kind, and that cuts against the current
state of affairs rather than excusing it.

`/align-tactics` closed its gap **structurally**: `land-align-round` writes the
marker in the same process that lands the round, the same guarantee `park-node`
and `transition-node` already carry. Even if its ratchet were deleted, the
guarantee would survive in code.

`/qa-fix`'s fix-finalize marker is still a **prose instruction to the model**,
duplicated across `references/auto-fix-lane.md:187-196` and its condensed
`SKILL.md:428-437` mirror, which must be kept in sync by hand. Nothing
mechanical holds it. It needs a prose ratchet more than the structural fix
does, not less — and it is the one that has none.

The regression is silent in the worst way: a dropped marker does not fail a
test, it wedges a job. `dispatch-self-close --node` HOLDs for want of the
marker (`dispatch-self-close:48-101`), and the node stays claimed until a
person notices.

## What the ratchet must assert

Model it on `test-align-tactics-terminal-marker.sh` — a prose/fenced-block
guard over skill doctrine, not a functional harness. Each requirement is its
own assertion so a regression in any one of them is legible on its own.

1. **`references/auto-fix-lane.md` carries the fix-finalize marker call.** A
   fenced `mark-node-terminal "$N" fix-attempt` in the fix-finalize step.
2. **`SKILL.md`'s condensed mirror carries it too.** The two-file duplication
   is the drift risk; assert both, or the ratchet passes while the mirror
   silently loses it.
3. **The ordering constraint survives.** Both files must state that the marker
   comes **after** the PR comment, the `dispatch-mark-complete --phase qa`
   phase marker, and the outcome envelope. `Stop` fires on every turn yield,
   not only on terminal exit, so writing the marker early lets the hook reap
   the job before those writes land. Ordering is the load-bearing half and is
   the part most likely to be lost to a well-meaning reflow.
4. **The node-lane scoping survives.** The marker is `TARGET_KIND=node` only;
   the legacy issue lane has no such marker. An assertion that drops this would
   invite a wrong fix in the other direction.
5. **The `no-claim` calls are still present** (`SKILL.md:90`, `:100`). Asserted
   alongside 1–2 for the same reason
   `test-align-tactics-terminal-marker.sh:101` asserts its exit-12 counterpart:
   without it, the ratchet can be satisfied by deleting the wrong marker call.
6. **`fix-attempt` is the enum member used**, not a new one. It is the existing
   member for "a fix pass spent an attempt (retry by design)", which is this
   path's exact shape.

## Wiring

`.github/workflows/unit-tests.yml`, hand-added as its own step next to the
`align-tactics` ratchet at `:233-234`. This matters: `run-unit-tests.sh` globs
only `.claude/skills/dispatch-propagate/scripts/test-*.sh`, so a suite left
outside that directory — or inside it but never referenced — ships dead and
gives false assurance. Put the new file at
`.claude/skills/dispatch-propagate/scripts/test-qa-fix-terminal-marker.sh`
alongside its sibling, and confirm the new step appears in a CI run's job list
rather than trusting the glob.

## Reuse

- `.claude/skills/dispatch-propagate/scripts/test-align-tactics-terminal-marker.sh`
  — the whole template: `dispatch-test-fixture.sh` sourcing, `GUARD_ROOT`
  resolution, per-row `assert_eq`, and the header note that a legitimately
  changed expectation means updating the row **and** confirming the guarantee
  still holds at every site, never dropping a row to make the suite green
  (`.claude/rules/test-integrity.md`).
- `.claude/skills/dispatch-propagate/scripts/test-align-tactics-write-path-freshness.sh`
  — the older prose-guard precedent the above is itself modelled on.

## Out of scope

Converting `/qa-fix`'s fix-finalize marker from prose into a structural
in-process write, the way `land-align-round` did for `/align-tactics`. That is
the better greenfield answer and should be its own node: the fix-finalize path
has no single script that owns the land, so it is a real redesign, not a
wrapper. This node buys the ratchet now, which is worth having either way — the
ratchet is what would catch a regression *during* such a redesign.
