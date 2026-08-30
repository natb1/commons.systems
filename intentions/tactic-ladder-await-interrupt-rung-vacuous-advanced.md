---
id: tactic-ladder-await-interrupt-rung-vacuous-advanced
kind: tactic
statement: Stop dispatch-ladder-await reporting `advanced` unconditionally on
  the interrupt rungs — its probe asks `.phase != "$FROM_PHASE"`, but `fix` and
  `conflict` are awaited rungs that are deliberately not `Phase` members, so on
  those rungs the comparison is trivially true for every node and the await
  reports success whether or not the launched work accomplished anything, which
  makes /fix-checks' await vacuous and short-circuits the lane-pass probe before
  it is ever consulted
owner: ai
status: codified
parent: null
rationale: "Found on 2026-08-13 while reviewing PR #3077 (merged as 7410e07f),
  which fixed the opposite defect — a successful pass reported as `stalled` — by
  adding the `execution.lane_pass` stamp and a second await probe. Tracing the
  selector's emitted vocabulary to check which rung a writer must stamp exposed
  this one. `graph-select-target`'s `sensor_gate` emits `fix` as the selected
  phase at lines 829, 849, 1055 and 1064, and `conflict` at lines 1038 and 1045;
  `graph-select-target:1207` prints `node $id $kind $emit_phase`;
  `dispatch-ladder-advance:232` parses that with `read -r _ _ KIND PHASE
  <<<\"$SPEC_LINE\"` and passes the value straight through as the awaited
  FROM_PHASE. So `fix` and `conflict` are real awaited rungs. Neither is a
  member of `PHASES` — deliberately, since they are interrupts rather than
  ladder rungs; `packages/intentionsutil/src/schema.ts` declares the wider
  `DISPATCH_PHASE_NAMES = [...PHASES, 'fix', 'conflict']` precisely because of
  this. On such a rung `dispatch-ladder-await`'s probe `.phase != \"fix\"` (or
  `!= \"conflict\"`) is true for every node in the graph, so the await returns
  `advanced` at exit 0 unconditionally. The defect is the mirror image of the
  one PR #3077 fixed: a false SUCCESS rather than a false stall. Consequences:
  /fix-checks' await is vacuous, and because the phase probe runs first it
  short-circuits before the new lane-pass probe is reached on exactly those
  rungs — which is why `dispatch-conflict` Step 7b's stamping of the node's
  persisted `phase` (wrong on the router's conflict interrupt, where the rung is
  `conflict`) currently costs nothing. It is unreachable, not fixed."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
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
## Context

### The defect

`dispatch-ladder-await` decides a phase completed by comparing `origin/main`
graph state against the rung it was launched at
(`.claude/skills/dispatch-ladder/scripts/dispatch-ladder-await:439-446`):

```
verify-landed ... --jq ".phase != \"$FROM_PHASE\""   →  advanced
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
  unmodified as the await's from-phase (`dispatch-ladder-run:1380` invokes
  `"$AWAIT" "$NODE_ID" "$PHASE" --timeout-s ... --since "$PASS_SINCE"`).
- `dispatch-graph-execute:185-186` maps those same rungs to their lanes
  (`tactic:fix → /fix-checks`, `tactic:conflict → /dispatch-conflict`).

Neither name is a `PHASES` member, and that is deliberate — they are router
interrupts, not ladder rungs. `packages/intentionsutil/src/schema.ts:59-67`
declares `PHASES` (draft, align-tactics, implement, qa, review, main-qa, done)
and `:105` declares the wider `DISPATCH_PHASE_NAMES = [...PHASES, "fix",
"conflict"]` for exactly this reason. So on an interrupt rung the await reports
`advanced` at exit 0 whether the launched work accomplished anything or nothing
at all.

### The mirror image of the defect PR #3077 fixed

That is the framing that makes this node legible.
[[tactic-ladder-await-phase-only-completion-test]] was a false **stall**: a lane
that had done substantial correct work was reported `stalled`, and the ladder
halted. This is a false **success**: a lane that did nothing is reported
`advanced`, and the ladder steps on. Same probe, same missing knowledge about
what the rung means — opposite sign, and the false-success direction is the more
dangerous one, because a halt at least summons a reader.

### Two consequences

**1. `/fix-checks`'s await is vacuous.** It reports `advanced` regardless of
outcome. A `/fix-checks` pass that pushed nothing, fixed nothing, or died is
indistinguishable from one that turned CI green.

**2. It makes a real stamp mismatch unreachable rather than fixed.** Because the
vacuous phase probe runs *first* (`:439-446`), it short-circuits before the
`execution.lane_pass` probe (`:456-467`, whose own comment reads "THE PHASE
PROBE STAYS AHEAD OF THIS ONE") is ever consulted on these rungs.
`dispatch-conflict` SKILL.md Step 7b (`:1301-1302`) stamps the node's persisted
`phase`. That is the correct rung on the provision-exit-11 entry, where advance
reports the node's own ladder phase — and the WRONG rung on the router's
conflict interrupt, where the selector emits `conflict`. Today the mismatch
costs nothing only because the probe never runs there. **The vacuity fix and the
stamp fix must land in the same change** — otherwise the first correct-looking
fix to the phase probe converts a dormant mismatch into a live one and turns
every conflict-interrupt pass into a `stalled`. That is why Unit 3 below depends
on Units 1 and 2 and all three ship in one PR.

Two further sites read `graph_verdict`'s answer and inherit the same vacuity;
both are fixed centrally by the single gate in `graph_verdict`, with no code
change of their own:

- the held-session NOTE at `dispatch-ladder-await:617-620`, which prints "HAS
  moved off '$FROM_PHASE'" on a vacuously-`advanced` held verdict;
- the live poll at `:640-667`, which records an early sighting on a PROGRESS
  verdict.

### The greenfield design, and what this plan does instead

**Ideal, building from scratch.** The awaited rung is *propagated* to the
worker, never re-derived by it. The router already holds it —
`dispatch-graph-execute:164` parses `<id:kind:phase>` and `:181-189` branches on
it — so it would hand the rung to the launched lane (job-dir file or env var),
and every completing lane would stamp `execution.lane_pass.phase` with the value
it was handed, verbatim. The reader would then ask exactly one question ("did
this launch's pass complete?"), the phase-equality probe would exist only for
lanes that genuinely move `phase`, and the entire class of writer/reader rung
mismatches — the class this node and `dispatch-conflict`'s "Known gap" note both
live in — would be structurally unreachable. Complementarily, `PHASES` would
have one home readable from shell (a generated constant or a `--dump-phases`
mode on an owned primitive), so no script mirrors it.

**Why this plan is the brownfield step.** Propagating the rung touches
`dispatch-graph-execute`, the provision-exit-11 conflict spawn, and every lane
skill's completion seam; exporting `PHASES` to shell needs a new primitive plus
its own drift check. That is more than one PR, and it is not what unblocks the
live defect. This plan fixes the two writers' derivations and makes the reader's
phase probe meaningful-only, mirroring `PHASES` in bash with a mechanical drift
assertion in the existing test suite. The greenfield design stays worth filing
separately; nothing here forecloses it.

### The code already points here

A fixer will find the annotations without needing this node. All three must be
brought true by this change (Units 2 and 3):

- `packages/intentionsutil/src/schema.ts:84-104` — the `DISPATCH_PHASE_NAMES`
  doc comment names this defect ("currently UNREACHABLE rather than fixed") and
  warns against "simplifying" the set back down to `PHASES`, which would break
  the fix rather than the bug. **The warning stays; only the
  unreachable-not-fixed narration changes.**
- `packages/intentionsutil/scripts/apply-lane-pass.ts:42-53` — states the writer
  rule ("PASS THE RUNG THE LADDER AWAITED AT, which is not always the node's
  persisted `phase`") and identifies the two `dispatch-conflict` entries where
  the node's `phase` and the rung diverge.
- `.claude/skills/dispatch-conflict/SKILL.md:1305-1313` — a "Known gap,
  deliberately left alone here" note pointing at this node's fix.

### No schema change is needed

`DISPATCH_PHASE_NAMES` already accepts both `fix` and `conflict`
(`schema.ts:105`), and `LANE_PASS_LANES` already lists `fix-checks` alongside
`conflict` and `qa-fix` (`schema.ts:120`) — PR #3077 added it as vocabulary
ahead of its writer, with the comment at `:113-116` saying so. (An earlier
reading of this node's cure assumed `fix-checks` still had to be added; it does
not.) `apply-lane-pass.ts` needs no code change either — only its header
narration.

### Related

- [[tactic-ladder-await-phase-only-completion-test]] — the twin this mirrors:
  the false-stall defect on the same probe, fixed by PR #3077 (merged
  `7410e07f`), which built the `execution.lane_pass` machinery this change
  completes. Still `status: raw`, `phase: null`; not touched here.
- `tactic-dispatch-ladder-exit-code-space` (phase `implement`) is widening
  `advance`/`await`'s exit-code space and explicitly names this node in its own
  "Explicitly out of scope" list (`intentions/tactic-dispatch-ladder-exit-code-space.md:340-342`)
  as an await test-coverage gap it leaves alone. No semantic overlap. It does
  edit `dispatch-ladder-await`'s `pruned` arm (exit 0 → 17) and
  `test-dispatch-ladder-await.sh:185`, so expect a **textual** merge overlap
  with Unit 3 in those two files and merge `origin/main` before finishing.

---

## Unit 1 — `/fix-checks` writes the `fix`-rung lane-pass stamp

**Scope.** `.claude/skills/fix-checks/SKILL.md` only. `/fix-checks` stamps
nothing today — the file contains no `apply-lane-pass` callsite at all — so on
the `fix` rung the ladder has no durable evidence to read once Unit 3 removes
the vacuous `advanced`. Add the stamp at the node-lane completion seam, which
already knows whether the pass pushed and already lands its state-only writes.

Both edits go inside the "Node-lane completion" section (`:135-204`):

1. **Push-outcome block (`:147-177`, fenced bash at `:156-177`).** `HEAD_SHA` is
   already computed at `:157`; the existing order is
   `apply-fix-state --spend-attempt` (`:170-171`),
   `apply-fix-state --record-push "$HEAD_SHA"` (`:172-173`), then **one**
   `graph-commit --base "$N=$FRESH_BLOB"` (`:174-176`). Insert a third
   `apply-*` call after `--record-push` and **before** the `graph-commit` line,
   so all three writes land in that same commit:

   ```bash
   node --import tsx/esm packages/intentionsutil/scripts/apply-lane-pass.ts \
     "$N" --stamp --lane fix-checks --phase fix --sha "$HEAD_SHA" \
     || echo "fix-checks: apply-lane-pass stamp failed on $N — continuing" >&2
   ```

2. **No-push-outcome block (`:179-204`, fenced bash at `:188-203`).** Same
   insertion after `apply-fix-state --spend-attempt` (`:199-200`) and before the
   `graph-commit` at `:201-203`, **without `--sha`** (there is no new sha). A
   no-repro / flake pass is still a completed pass and must stamp: the whole
   point is that the ladder can distinguish it from a dead worker.

3. **`--dir` is deliberately omitted**, matching the two `apply-fix-state` calls
   beside it. `apply-lane-pass.ts` resolves its store from its own file location
   (`apply-lane-pass.ts:64-65`), and these blocks run from the PR-branch worktree
   after refreshing `intentions/$N.md` from `origin/main` — the same resolution
   the sibling calls rely on. Adding `--dir` would change which store is written.

4. **Non-fatal on failure**, matching `dispatch-conflict` Step 7b's explicit rule
   and qa-fix's "warns and continues": print to stderr and carry on. A failed
   stamp costs one false `stalled`; a hard stop here skips
   `mark-node-terminal`, HOLDs the job, and wedges a worker slot.

5. **Prose cross-references to update** so the seam's write set is described
   correctly everywhere it is named: `:136-146` (the completion-duty paragraph —
   add the third write and one sentence on why: the ladder reader has no other
   evidence on the `fix` rung), the commit messages at `:176` and `:202`, and the
   three back-references at `:423`, `:878`, and `:915-916`, each of which spells
   the seam as "`apply-fix-state --record-push` + `graph-commit`".

**Gated on the node lane.** Every graph-native action in this skill is gated on
`TARGET_KIND=node` (`:105` binds `N="$NODE_ID"; TARGET_KIND=node`; see the
target-resolution split at `:52-107` and e.g. `:906`). The issue lane has no
`execution.lane_pass` concept and no analogous seam — the stamp must not appear
there.

**Explicitly out of scope.** The issue lane; `execution.fix` semantics and who
clears it (the selector, on a later green tick — unchanged); the exit-4 /
escalation paths, which deliberately stamp nothing and are awaited as `parked`
or `stalled`; Step 4's flake-tracking tactic writes and their separate
`graph-commit`; `dispatch-ladder-await` itself.

**Recommended model** — sonnet.

---

## Unit 2 — `dispatch-conflict` Step 7b stamps the rung, not the node's phase

**Scope.** `.claude/skills/dispatch-conflict/SKILL.md`, Step 7b "First half —
stamp the lane pass", `:1294-1315`. The callsite at `:1301-1302` reads:

```bash
( cd "$PROJECT_ROOT" && npx tsx packages/intentionsutil/scripts/apply-lane-pass.ts \
    "$SOURCE_ID" --stamp --lane conflict --phase "$NODE_PHASE" \
    --sha "$(git -C "$WT" rev-parse HEAD)" --dir "$PROJECT_ROOT/intentions" )
```

Change **only the `--phase` value**, and only the instruction that tells the
session which literal to substitute. The rule the prose must now carry:

- read `execution.conflict` from the **same** fresh-`origin/main` `NODE_MD` copy
  the second half already reads it from (`~:1340`);
- `execution.conflict` **non-null** → the router's conflict interrupt entry; the
  selector emitted `conflict` as the rung, so substitute the literal `conflict`;
- `execution.conflict` **null** → the provision-exit-11 entry; advance reported
  the node's own ladder phase, so substitute the node's `phase` exactly as
  today.

The second half already performs this same null/non-null read, so this is a
value change, not new branching. Keep the surrounding instructions verbatim:
substitute a **literal** (no shell variable survives between Bash calls), run out
of `$PROJECT_ROOT` never `$WT`, keep `--dir "$PROJECT_ROOT/intentions"`, keep
`dangerouslyDisableSandbox: true` for `npx`, and keep the **non-fatal-warning**
paragraph (`:1327-1338`) exactly as written — it deliberately disagrees with the
hard-stop rule further down and must not be "fixed" to match.

**Delete** the "Known gap, deliberately left alone here" paragraph (`:1305-1313`)
and replace it with a short statement of the rule above and why the two entries
diverge. Leaving it standing would contradict the code.

**Explicitly out of scope.** Step 7b's second half (the
`apply-conflict-state` mechanical/intention verdict); Lanes 1 and 2; the single
`graph-commit` that lands both halves; Steps 8–10; `apply-lane-pass.ts`'s code.

**Recommended model** — sonnet.

---

## Unit 3 — gate the phase probe on `Phase` membership, and prove it

**Scope.** `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-await` and
`.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-await.sh`; plus
doc-comment-only corrections in `packages/intentionsutil/src/schema.ts` and
`packages/intentionsutil/scripts/apply-lane-pass.ts`.

**Dependencies** — Units 1 and 2. Landing this gate without them turns every
`fix` and conflict-interrupt pass into a `stalled` halt.

### 3.1 The membership test

Add, alongside the other script-level constants (after the `--since` validation
block ending at `:345`, above `graph_verdict` at `:377`):

```bash
# MIRROR OF `PHASES` (packages/intentionsutil/src/schema.ts:59-67) — the closed
# set the node's own `.phase` field can hold. Kept honest by a drift assertion
# in test-dispatch-ladder-await.sh; nothing shell-callable exports the set.
LADDER_PHASES=("draft" "align-tactics" "implement" "qa" "review" "main-qa" "done")
is_ladder_phase() {
  local p
  for p in "${LADDER_PHASES[@]}"; do [[ "$1" == "$p" ]] && return 0; done
  return 1
}
```

**A positive membership test, not a `fix`/`conflict` denylist — deliberately.**
The two fail in opposite directions. A future interrupt rung that nobody
remembers to add is *excluded by default* under a positive test: the verdict
falls through to the lane-pass probe or `unchanged`, i.e. a halt, which is safe
and loud. Under a denylist the same omission silently restores exactly this
bug's vacuous `advanced`. The residual risk of a positive list — a new `Phase`
member added to `schema.ts` but not mirrored here — produces a false `stalled`,
which halts rather than steps on, and is caught outright by the drift assertion
in 3.3.

### 3.2 The gate

Wrap the phase probe at `:439-446` in `if is_ladder_phase "$FROM_PHASE"; then …
fi`, structurally mirroring the existing `review` from-phase gate at `:428-437`.

Preserve the body **verbatim** — the same three-answer discipline (rc `0` →
`advanced`; rc `4` → fall through; anything else → `unknown`). Do not collapse
the `case`, do not reorder it relative to the lane-pass probe at `:456-467`, and
do not touch the `absent` / `office_hours` / `blocked_by` / `reviewed` probes
above it. On an interrupt rung the probe is simply **not entered**, so control
reaches the lane-pass probe — which already matches
`.execution.lane_pass.phase == "$FROM_PHASE"` literally and already accepts
`fix`/`conflict` per `schema.ts:78-82` — or falls to `unchanged` (`:469`).

Comments to update in the same file, so the invariant is readable where it is
enforced:

- `:373-376` — `graph_verdict`'s ordering header, which today explains only why
  `absent` is checked first. Add that the phase probe now runs only on a real
  `Phase` rung, and why.
- `:448-450` — "THE PHASE PROBE STAYS AHEAD OF THIS ONE" still holds for `Phase`
  rungs; say that on an interrupt rung it does not run at all, so the stamp is
  the *only* completion evidence there.
- `:151-157` — "Two lanes finish a pass by pushing… dispatch-conflict's Lane 3
  and qa-fix's auto-fix fixing pass". It is three now: `/fix-checks` (Unit 1).
- `:217` (`advanced`) and `:221-224` (`lane-complete`) in the Stdout vocabulary
  block — record that an interrupt rung can never report `advanced`, and that
  such a rung therefore **requires `--since`**: without it the stamp is not
  consulted (`:456`) and the only reachable answers are `unchanged`/`stalled`.
  `dispatch-ladder-run:1380` always passes `--since`, so production is
  unaffected; a hand invocation without it is the case being documented.

No change to `dispatch-ladder-run`, and none to the held-session NOTE (`:617-620`)
or the live poll (`:640-667`) — both consume `graph_verdict` and are corrected by
this one gate.

### 3.3 Tests

Extend `test-dispatch-ladder-await.sh` using its existing machinery only —
`set_graph <absent> <parked> <blocked> <phase> [<reviewed>] [<lane>]`
(`:129-136`), `run_await <want-exit> <want-stdout-prefix> <label> [extra args]`
(`:148-163`), the `FROM=` variable (`:145-146`), and `SINCE=1750000000`
(`:239`). **No new `verify-landed` stub arm is needed**: the stub keys on
substrings of the `--jq` argument, and the fix removes a call rather than adding
one. Do not touch the documented ordering trap at `:115-120` (the `*lane_pass*`
arm must stay ahead of `*.phase*`).

Add a new section after the `execution.lane_pass` section (which ends at `:277`):

- **The regression.** `FROM=fix`; `set_graph 4 4 4 0 4 4`; `--since "$SINCE"` →
  expect `12` / `stalled <node> fix`. `RC_PHASE=0` is the whole point: it says
  verify-landed *would* answer "yes, `.phase != fix`" if asked, and the correct
  verdict is still `stalled`. Before the fix this returns `0`/`advanced`.
- **The probe is not merely outranked, it is not called.** `FROM=fix`;
  `set_graph 4 4 4 1 4 4`; `--since "$SINCE"` → `12`, not `14`. An rc of `1` on
  the phase read would be `unknown-graph-read` if the probe ran.
- **A stamped interrupt pass completes.** `FROM=fix`; `set_graph 4 4 4 4 4 0`;
  `--since "$SINCE"` → `0` / `lane-complete <node> fix`.
- **No `--since`, no completion.** `FROM=fix`; `set_graph 4 4 4 0 4 0`; no
  `--since` → `12` / `stalled <node> fix`.
- **All four again with `FROM=conflict`.**
- **Halting precedence still outranks the gate.** On `FROM=fix` with
  `RC_PHASE=0` throughout: `set_graph 0 4 4 0` → `0` / `pruned <node>`;
  `set_graph 4 0 4 0` → `11` / `throw <node> parked`; `set_graph 4 4 0 0` →
  `11` / `throw <node> blocked-by`.
- **A real `Phase` rung is unchanged.** Keep the existing `FROM=qa`
  `set_graph 4 4 4 0` → `0` / `advanced` case (`:199`) and the phase-outranks-stamp
  case (`:268-269`) exactly as they are; they are the regression guard on the
  gate's positive arm.
- **The drift assertion.** `SCRIPT_DIR` (`:55`) is the real scripts directory, so
  the repo root is `$SCRIPT_DIR/../../../..`. Extract the `PHASES` literal from
  `$SCRIPT_DIR/../../../../packages/intentionsutil/src/schema.ts` (the block from
  `export const PHASES` to the closing `];`) and the `LADDER_PHASES` literal from
  `$SCRIPT_DIR/dispatch-ladder-await`, normalize both to a space-separated list of
  the quoted values, and `fail` unless they are identical — with a message naming
  both files so the next reader knows which one to change.
- Add a numbered entry (7.) to the test file's own header list (`:5-45`),
  matching the style of entries 1–6: the interrupt rungs are not `Phase` members,
  so a phase-equality probe there is vacuous; the gate and the drift assertion are
  what keep it honest.

### 3.4 Doc-comment corrections (no code change)

- `packages/intentionsutil/src/schema.ts:84-104` — the passage now reading "The
  `dispatch-conflict` mismatch is currently UNREACHABLE rather than fixed … That
  vacuous-`advanced` defect is filed separately; when it is fixed, this writer
  must start stamping the rung" describes a state this change ends. Rewrite it to
  the fact: the reader gates its phase probe on `Phase` membership, so on an
  interrupt rung the stamp is the operative evidence; `dispatch-conflict` passes
  `conflict` on the interrupt entry and the node's phase on the provision entry;
  `/fix-checks` stamps `fix`. **Keep** the "Do not 'simplify' this set down to
  `PHASES`" warning — it is more load-bearing after this change, not less.
- `packages/intentionsutil/scripts/apply-lane-pass.ts:42-53` — same correction to
  the "PASS THE RUNG THE LADDER AWAITED AT" paragraph, whose last sentence
  currently says the `dispatch-conflict` divergence is "currently unreachable
  rather than correct". Also update `:120-121` in the header's WHY-THE-STAMP-EXISTS
  paragraph if it still says "Two lanes".

**Explicitly out of scope.** Any exit-code renumbering — that is
`tactic-dispatch-ladder-exit-code-space` (phase `implement`), which changes the
`pruned` arm to exit 17 and the matching assertion at
`test-dispatch-ladder-await.sh:185`. `graph-select-target`'s emitted vocabulary.
`dispatch-ladder-advance:232`'s parse. `dispatch-ladder-run`. Adding a
shell-callable `PHASES` primitive to `intentionsutil` (the greenfield item).
`apply-lane-pass.ts`'s executable code and its Vitest suite.

**Recommended model** — opus.

---

## Reuse

- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-await:428-437` — the
  `review` from-phase gate. The exact structural template for 3.2: a from-phase
  condition wrapping a probe, ahead of the generic phase comparison.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-await:456-467` — the
  `SINCE_ISO`-gated `execution.lane_pass` probe (plumbing at `:283-353`). Already
  correct for interrupt rungs; the fix only makes it reachable. No change.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-await.sh:106-136`
  — the `verify-landed` stub keyed on `--jq` substrings, its documented
  `*lane_pass*`-before-`*.phase*` ordering trap, and `set_graph`.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-await.sh:148-163`
  — `run_await`.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-await.sh:213-236`
  — the `reviewed`-gate test cases; the shape to copy for a from-phase-gated
  probe (asserting both that the gate fires and that it does not fire elsewhere).
- `packages/intentionsutil/scripts/apply-lane-pass.ts:198-223` (`applyLanePass` /
  `main`) — the primitive to invoke, unchanged. CLI:
  `apply-lane-pass.ts <node-id> --stamp --lane <lane> --phase <phase> [--sha <sha>] [--dir <intentions-dir>]`;
  pure of git/gh; landed by `graph-commit`.
- `.claude/skills/qa-fix/SKILL.md:434-435` and
  `.claude/skills/qa-fix/references/auto-fix-lane.md:208-209` — the one existing
  writer callsite pattern (`--lane qa-fix --phase qa --sha "$(git rev-parse HEAD)"`,
  warn-and-continue on failure).
- `.claude/skills/fix-checks/SKILL.md:105` — `N="$NODE_ID"; TARGET_KIND=node`,
  the node-id variable already in scope for the whole node lane.
- `.claude/skills/fix-checks/SKILL.md:156-177` and `:188-203` — the two
  completion-seam bash blocks, each already doing fetch → `FRESH_BLOB` →
  refresh-from-`origin/main` → `apply-fix-state` → one `graph-commit --base`.
- `packages/intentionsutil/src/schema.ts:59-67`, `:105`, `:118-120` — `PHASES`,
  `DISPATCH_PHASE_NAMES`, `LANE_PASS_LANES` (`fix-checks` already a member). Cited
  and mirrored; no code change.
- `.claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome:90`
  (`ALLOWED_PHASES=(…)`) — repo precedent for a hand-maintained bash array
  mirroring a closed TS-side set. This plan takes the precedent and adds the
  drift assertion it lacks.
- `.github/workflows/unit-tests.yml:304-313` — the ladder shell suites already run
  in CI; new cases need no new wiring.

## Verification

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-await.sh
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
```

```verify
bash -n .claude/skills/dispatch-ladder/scripts/dispatch-ladder-await
```

```verify
npm test --prefix packages/intentionsutil
```

The gate exists and is a positive membership test on the from-phase:

```verify
grep -q 'is_ladder_phase "$FROM_PHASE"' .claude/skills/dispatch-ladder/scripts/dispatch-ladder-await
```

Both writers stamp their rung, and the note that said the mismatch was harmless
is gone:

```verify
grep -q -- '--lane fix-checks --phase fix' .claude/skills/fix-checks/SKILL.md
```

```verify
if grep -q 'Known gap, deliberately left alone here' .claude/skills/dispatch-conflict/SKILL.md; then echo "FAIL: the forbidden pattern is still present in .claude/skills/dispatch-conflict/SKILL.md"; exit 1; fi
```

The stale "unreachable rather than fixed" narration is gone from both doc homes.
Both discriminators below are deliberately chosen to be strings that sit on ONE
line in the pre-change source — the fuller sentences they belong to are wrapped
across two comment lines (`schema.ts:100-101`,
`apply-lane-pass.ts:50-51`), so a `grep` for the whole sentence would find
nothing today and the negation would pass vacuously, before any change was made.
Verified against `origin/main` at authoring time: each string below matches
exactly once today, so each fence genuinely flips.

```verify
if grep -q 'defect is filed separately' packages/intentionsutil/src/schema.ts; then echo "FAIL: the forbidden pattern is still present in packages/intentionsutil/src/schema.ts"; exit 1; fi
```

```verify
if grep -q 'currently unreachable rather' packages/intentionsutil/scripts/apply-lane-pass.ts; then echo "FAIL: the forbidden pattern is still present in packages/intentionsutil/scripts/apply-lane-pass.ts"; exit 1; fi
```

The `DISPATCH_PHASE_NAMES` set and its do-not-simplify warning survive:

```verify
grep -q 'Do not "simplify" this set down to' packages/intentionsutil/src/schema.ts
```

**Manual and observe-in-production checks.**

- *In-flight ladder runs across the merge.* `dispatch-ladder-run` resolves its
  primitives from its own directory, so a run already detached when this lands
  will call the new `await` from the freshly-merged checkout. A run that launched
  a `fix` or `conflict` rung **before** the merge awaits it **after**, against a
  worker that stamped nothing — and now reads `stalled` (exit 12) where it used
  to read `advanced`. That is a loud halt, not silent misbehaviour; the recovery
  is re-spawning the ladder. Check `systemctl --user list-units 'dispatch-ladder-*'`
  before merging and re-spawn any node whose run halts.
- *The stamp is really written.* After the next `/fix-checks` pass on a node
  driven through `/dispatch-ladder`, read the node at `origin/main` —
  `npx tsx packages/intentionsutil/scripts/dump-node.ts --dir <abs intentions path> <node-id>`
  — and confirm `execution.lane_pass` is `{lane: fix-checks, phase: fix, at: …}`
  with an `at` inside that launch window. Both the no-push and the pushed
  outcomes must produce one; the pushed one additionally carries `sha`.
- *The verdict changed shape, not just the code path.* In the same run's journald
  log (`journalctl --user -u 'dispatch-ladder-*'`), the `fix` rung should now
  report `lane-complete <node> fix` where it previously reported
  `advanced <node> fix -> origin/main`. A `stalled <node> fix` there means the
  lane genuinely completed nothing — which is the behaviour this change exists to
  restore, not a regression.
- *The conflict interrupt.* A conflict resolved through the router's interrupt
  entry (`execution.conflict` non-null) must now stamp `phase: conflict`, and a
  conflict entered by provision exit 11 (`execution.conflict` null) must still
  stamp the node's own phase. Distinguish the two by reading `execution.conflict`
  on the node before the pass; the stamp is the only observable difference.
- *Skill-file writes under the sandbox.* Every unit here edits files under
  `.claude/skills/`, a read-only carve-out in the repo-root checkout. Work from
  the node's own worktree; if a commit touching these paths is denied, that is
  the known auto-mode restriction on committing skill files, not a plan defect.
