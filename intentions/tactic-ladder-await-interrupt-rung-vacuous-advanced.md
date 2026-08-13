---
id: tactic-ladder-await-interrupt-rung-vacuous-advanced
kind: tactic
statement: Stop dispatch-ladder-await reporting `advanced` unconditionally on the
  interrupt rungs — its probe asks `.phase != "$FROM_PHASE"`, but `fix` and
  `conflict` are awaited rungs that are deliberately not `Phase` members, so on
  those rungs the comparison is trivially true for every node and the await
  reports success whether or not the launched work accomplished anything, which
  makes /fix-checks' await vacuous and short-circuits the lane-pass probe before
  it is ever consulted
owner: ai
status: raw
parent: null
rationale: "Found on 2026-08-13 while reviewing PR #3077 (merged as 7410e07f),
  which fixed the opposite defect — a successful pass reported as `stalled` — by
  adding the `execution.lane_pass` stamp and a second await probe. Tracing the
  selector's emitted vocabulary to check which rung a writer must stamp exposed
  this one. `graph-select-target`'s `sensor_gate` emits `fix` as the selected
  phase at lines 829, 849, 1055 and 1064, and `conflict` at lines 1038 and 1045;
  `graph-select-target:1207` prints `node $id $kind $emit_phase`;
  `dispatch-ladder-advance:232` parses that with
  `read -r _ _ KIND PHASE <<<\"$SPEC_LINE\"` and passes the value straight
  through as the awaited FROM_PHASE. So `fix` and `conflict` are real awaited
  rungs. Neither is a member of `PHASES` — deliberately, since they are
  interrupts rather than ladder rungs; `packages/intentionsutil/src/schema.ts`
  declares the wider `DISPATCH_PHASE_NAMES = [...PHASES, 'fix', 'conflict']`
  precisely because of this. On such a rung `dispatch-ladder-await`'s probe
  `.phase != \"fix\"` (or `!= \"conflict\"`) is true for every node in the
  graph, so the await returns `advanced` at exit 0 unconditionally. The defect
  is the mirror image of the one PR #3077 fixed: a false SUCCESS rather than a
  false stall. Consequences: /fix-checks' await is vacuous, and because the
  phase probe runs first it short-circuits before the new lane-pass probe is
  reached on exactly those rungs — which is why `dispatch-conflict` Step 7b's
  stamping of the node's persisted `phase` (wrong on the router's conflict
  interrupt, where the rung is `conflict`) currently costs nothing. It is
  unreachable, not fixed."
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
## The defect

`dispatch-ladder-await` decides a phase completed by comparing `origin/main`
graph state against the rung it was launched at:

```
gh ... --jq ".phase != \"$FROM_PHASE\""   →  advanced
```

That test is only meaningful when `FROM_PHASE` is a value `.phase` could
actually hold. Not every awaited rung is.

| Awaited rung | A `Phase` member? | What the probe asks | Result |
|---|---|---|---|
| `align-tactics` … `main-qa` | yes | did the node leave this phase | meaningful |
| `fix` | **no** | is `.phase != "fix"` | true for every node |
| `conflict` | **no** | is `.phase != "conflict"` | true for every node |

The chain that makes `fix` and `conflict` real awaited rungs:

- `graph-select-target`'s `sensor_gate` emits `fix` as the selected phase at
  lines 829, 849, 1055, 1064, and `conflict` at lines 1038, 1045.
- `graph-select-target:1207` prints `node $id $kind $emit_phase`.
- `dispatch-ladder-advance:232` parses it with
  `read -r _ _ KIND PHASE <<<"$SPEC_LINE"` and passes the value through
  unmodified as the await's from-phase.

Neither name is a `PHASES` member, and that is deliberate — they are router
interrupts, not ladder rungs. `packages/intentionsutil/src/schema.ts` declares
the wider `DISPATCH_PHASE_NAMES = [...PHASES, "fix", "conflict"]` for exactly
this reason. So on an interrupt rung the await reports `advanced` at exit 0
whether the launched work accomplished anything or nothing at all.

## The mirror image of the defect PR #3077 fixed

That is the framing that makes this node legible.
[[tactic-ladder-await-phase-only-completion-test]] was a false **stall**: a lane
that had done substantial correct work was reported `stalled`, and the ladder
halted. This is a false **success**: a lane that did nothing is reported
`advanced`, and the ladder steps on. Same probe, same missing knowledge about
what the rung means — opposite sign, and the false-success direction is the more
dangerous one, because a halt at least summons a reader.

## Two consequences

**1. `/fix-checks`'s await is vacuous.** It reports `advanced` regardless of
outcome. A `/fix-checks` pass that pushed nothing, fixed nothing, or died is
indistinguishable from one that turned CI green.

**2. It makes a real stamp mismatch unreachable rather than fixed.** Because the
vacuous phase probe runs *first*, it short-circuits before the new
`execution.lane_pass` probe is ever consulted on these rungs.
`dispatch-conflict` Step 7b stamps the node's persisted `phase`. That is the
correct rung on the provision-exit-11 entry, where advance reports the node's
own ladder phase — and the WRONG rung on the router's conflict interrupt, where
the selector emits `conflict`. Today the mismatch costs nothing only because the
probe never runs there. **Whoever fixes the vacuity must fix the stamp in the
same change**, or they will convert a dormant mismatch into a live one: the
first correct-looking fix to the phase probe turns every conflict-interrupt pass
into a `stalled`.

## The cure

Small, now that PR #3077 landed the machinery:

1. `/fix-checks` stamps `--lane fix-checks --phase fix` on completion.
2. `dispatch-conflict` stamps `conflict` on the interrupt path — its Step 7b
   already distinguishes the two entries, so this is a value change, not new
   branching.
3. The phase probe must be made not to fire on a rung that is not a `Phase`
   member, so the lane-pass probe becomes the operative test there.

No schema change is needed. `DISPATCH_PHASE_NAMES` already accepts both `fix`
and `conflict`, and `LANE_PASS_LANES` already lists `fix-checks` alongside
`conflict` and `qa-fix` — PR #3077 added it as vocabulary ahead of its writer,
with a comment saying so. (An earlier reading of this node's cure assumed
`fix-checks` still had to be added; it does not. Verified at
`packages/intentionsutil/src/schema.ts`.)

## The code already points here

A fixer will find the annotations without needing this node:

- `packages/intentionsutil/src/schema.ts`'s `DISPATCH_PHASE_NAMES` doc comment
  names the defect and warns against "simplifying" the set back down to
  `PHASES`, which would break the fix rather than the bug.
- `packages/intentionsutil/scripts/apply-lane-pass.ts`'s header states the
  writer rule — stamp the rung the ladder awaited at — and identifies the two
  `dispatch-conflict` entries where the node's `phase` and the rung diverge.
- `.claude/skills/dispatch-conflict/SKILL.md` Step 7b carries a "Known gap,
  deliberately left alone here" note pointing at this node's fix.

## Related

- [[tactic-ladder-await-phase-only-completion-test]] — the twin this mirrors:
  the false-stall defect on the same probe, fixed by PR #3077. Fixing this one
  completes that one's reader.
