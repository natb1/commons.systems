---
id: tactic-dispatch-ladder-exit-code-space
kind: tactic
statement: Widen dispatch-ladder-advance/-await to one shared exit-code space —
  carving refused, idle-wait, idle-requeue and complete out of today's
  overloaded 2, 10 and 0 — so dispatch-ladder-run branches on codes instead of
  parsing their stdout strings
owner: ai
status: codified
parent: null
rationale: null
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

# Widen dispatch-ladder-advance/-await to one shared exit-code space — carve `refused`, `idle-wait`, `idle-requeue` and `complete` out of today's overloaded 2, 10 and 0, so dispatch-ladder-run branches on codes instead of parsing their stdout strings

## Context

`dispatch-ladder-run` is a plain shell driver whose whole premise is that the
ladder's branch surface is exit codes and nothing in it needs judgment
(strategy-graph-native-dispatch clarification 226, "VERIFIED THIS ROUND"). Two
of its branches falsify that premise today: they recover, by string-matching a
sibling's stdout, information the exit code dropped.

Originally filed as a deferred design proposal out of PR #3072
(`tactic-dispatch-ladder-skill`), whose `/align` interview ruled "rename, don't
reinvent — their internals are not changed by this node". Widening the
primitives' contracts was the doctrine change that ruling deferred; this node is
that change. **The 2026-08-14 draft table in this body was verified against the
working tree on 2026-08-18 and three of its rows were found wrong; the plan
below is the corrected form. Where this plan and the older narrative differ, this
plan governs.**

### The two real defects (verified 2026-08-18 against the working tree)

1. **`advance` exit 10 is one code for four reasons.**
   `dispatch-ladder-advance` prints `idle <id> <reason>` and exits 10 for
   `ci-waiting` (`dispatch-ladder-advance:432-433`), `stale-selection`
   (`:437-438`), `scope-stale-demoted` (`:442-443`) and `not-selectable`
   (`:227-229`). The driver needs a *different action* for three of those
   groups, so it re-derives the split by parsing field 3 of stdout:
   `REASON=$(awk '{print $3; exit}' <<<"$ADV_OUT")` at
   `dispatch-ladder-run:1473`, then `case "$REASON" in ci-waiting) … 
   stale-selection|scope-stale-demoted) … *) …` at `:1474-1523`.

2. **`await` exit 0 carries a run-ending verdict alongside three continue-verdicts.**
   `dispatch-ladder-await` exits 0 for `advanced`, `reviewed`, `lane-complete`
   *and* `pruned` (`dispatch-ladder-await:508-529`). Only `pruned` ends the run,
   so `dispatch-ladder-run:1414-1416` singles it out with
   `if [[ "$AW_DISP" == "pruned" ]]; then halt 0 pruned …; fi; break`.

3. **`advance` exit 2 is usage-error OR strategy-refusal.**
   `dispatch-ladder-advance:247-250` prints `refused <id> strategy` and exits 2;
   its own header (`:87-89`, `:106-110`) calls the overload out by name. The
   driver cannot tell a caller bug from a legitimate steady-state answer:
   `dispatch-ladder-run:1541` is `2) halt 2 refused "$ADV_OUT" ;;` — every exit 2
   is labelled `refused`, including a genuine bad flag.

Each is control flow living in string matching, one rename away from silent
breakage. `dispatch-ladder-run`'s own header already commits to the fix's
principle: *"EXIT CODES — deliberately the primitives' codes, so a journald
reader sees one vocabulary across the whole ladder"* (`:270-271`).

### What the 2026-08-14 draft got wrong, and is corrected here

- **21 is taken, twice.** `dispatch-ladder-await` exit 21 is `held-observing`
  (`dispatch-ladder-await:261-266`, consumed by `dispatch-ladder-run:1440-1462`),
  and `dispatch-ladder-run`'s *own* caller-visible 21 is `--max-run-s` timeout
  (`dispatch-ladder-run:288-295`, which explicitly says "NOT the same 21
  dispatch-ladder-await exits"). The draft's `21 = complete` would have created a
  third meaning. **`complete` is 17 in this plan.**
- **Migration step 4 of the draft ("delete the driver's `verify-landed` terminal
  check, which code 21 subsumes") is wrong and is dropped.** `phase_is_done`
  (`dispatch-ladder-run:809-819`) and `classify_terminus` (`:821-889`) answer a
  question no exit code answers — *was stopping here legitimate* — per the
  standing requirement in clarification 232 and
  `intentions/tactic-ladder-terminus-owns-main-qa.md`. The driver's header states
  it outright: *"THE EXIT CODE AND THE TERMINUS ARE ORTHOGONAL, deliberately"*
  (`:297-300`). Nothing in this plan touches either function.
- **`await` exit 0 carries four tokens, not two**, and its header records a
  deliberate ruling that `lane-complete` shares 0 with `reviewed` because "a code
  of its own would force a new branch in dispatch-ladder-run for no behavioral
  difference. The distinct TOKEN is what carries the information onward"
  (`dispatch-ladder-await:245-249`). That is not a counter-position to this node;
  it is the *rule* this node generalizes, and Unit 3 records it as such.

### The governing rule this change establishes

> **A distinct exit code is warranted iff the caller must take a distinct
> ACTION. Everything finer rides the stdout token.**

Applied:

| current | verdicts | distinct caller actions | outcome |
|---|---|---|---|
| `advance` 2 | usage-or-env error; `refused … strategy` | fix your flags vs. run `/align-tactics <id>` | **split** → 2 usage, **3 refused** |
| `advance` 10 | ci-waiting; stale-selection; scope-stale-demoted; not-selectable | sleep-and-retry; requeue-now-on-budget; reconcile-then-halt | **split** → **15 idle-wait**, **16 idle-requeue**, 10 idle-halt |
| `advance` 10 | stale-selection vs. scope-stale-demoted | identical (bounded requeue) | **stay merged** on 16 |
| `await` 0 | advanced; reviewed; lane-complete | identical (`break`, loop again) | **stay merged** on 0 |
| `await` 0 | pruned | `halt 0` — ends the run | **split** → **17 complete** |

`10` deliberately remains the open-ended catch-all: `not-selectable` **and any
future reason `dispatch-ladder-advance` adds that does not warrant its own
caller action**. This preserves the defensive default the driver's own comment
at `dispatch-ladder-run:1514-1515` calls out ("not-selectable, and any reason a
future dispatch-ladder-advance adds").

### Why these numbers

Taken across the three scripts' union: 0, 1, 2, 10, 11, 12, 13, 14, 20, 21.
Also unavailable:

- **4** — `verify-landed`'s `not-landed` (`packages/intentionsutil/scripts/verify-landed:13-18`),
  a script in this very call chain (`dispatch-ladder-run:811`). Free, but reusing
  it invites confusion.
- **7 and 9** — the "unmapped code is an internal error" fixtures in
  `test-dispatch-ladder-run.sh:928` (`'7|weird …'`) and `:949` (`'9|surprise …'`).
  Leaving them unassigned keeps those regression tests meaningful.
- **12, 13** — used by `provision-node-worktree:46-90` for `stale-selection` /
  `scope-stale`, which is *tempting* to mirror, but both are already taken one
  layer up (`await` 12 = stalled, `advance` 13 = claimed).

So: **3** sits beside 2 as "the call was well-formed, but this id is not mine".
**15 / 16** sit adjacent to 10 so a naive caller grouping 10-16 as "the idle
family" still behaves correctly. **17** is the terminal-progress answer.

---

## Unit 1 — Teach `dispatch-ladder-run` the new codes while the old ones still work

Additive only. After this unit the driver accepts **both** spaces; no primitive
emits a new code yet, so nothing changes at runtime. This ordering (driver
first, contrary to the draft's step 2/3 order) means every commit on the branch
is independently safe on `main`.

**Scope**

- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run`, the `case
  "$adv_rc"` at `:1340-1543`:
  - Add `15)` — the body of today's `ci-waiting` arm (`:1477-1484`): `log_event
    idle "$PHASE" ci-waiting "re-polling in ${POLL_S}s"`, `poll_wait`, `continue`.
  - Add `16)` — the body of today's `stale-selection|scope-stale-demoted` arm
    (`:1485-1504`): the `requeue_budget` check, `halt 12 stalled` on drain, the
    decrement, and the `log_event idle "$PHASE" "$REASON"` line with the
    `ADV_ERR_LAST` fold.
  - Add `3)` — `halt 3 refused "$ADV_OUT"`. Narrow the existing `2)` arm
    (`:1541`) to `halt 2 usage "$ADV_OUT"`.
  - Leave the existing `10)` arm and its inner `case "$REASON"` intact.
- Same file, `case "$aw_rc"` at `:1395-1470`: add `17)` running the same body as
  today's `pruned` branch (`:1414-1416`) — `spawn_phase_eval "$PHASE"
  "$PASS_SINCE"` then `halt 0 pruned "…"`. Note the `spawn_phase_eval` call at
  `:1412` currently runs for *all* exit-0 verdicts including `pruned`; the new
  `17)` arm must call it too, before halting, or the pruned run loses its final
  phase evaluation.
- Same file, header: add `3   refused` to the EXIT CODES block at `:270-296` and
  narrow `2` to `usage`; update THE LOOP sketch at `:193-235` to list the new
  advance/await codes.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh`: add cases
  using the existing `set_seq` / `run_ladder` / `assert_eq` mechanism (helpers at
  `:120-136`, `:190-194`) —
  - `set_seq advance '15|idle tactic-fixture-node ci-waiting'` re-polls exactly
    as the code-10 `ci-waiting` case at `:434-445` does, including
    `events_have idle ci-waiting == 1`;
  - `set_seq advance '16|idle tactic-fixture-node stale-selection'` drains the
    requeue budget and halts 12, mirroring `:448-455`;
  - `set_seq advance '3|refused tactic-fixture-node strategy'` → run exits **3**,
    and `calls await == 0`;
  - `set_seq advance '2|'` → run exits 2 (add to the advance passthrough loop at
    `:934-945`, replacing the `"2|refused tactic-fixture-node strategy"` row with
    a bare usage row);
  - `set_seq await '17|pruned tactic-fixture-node'` → run exits 0, disposition
    `pruned`, `calls merge == 0`, mirroring `:423-431`.
  - Do **not** change the `'7|weird …'` and `'9|surprise …'` unmapped-code cases.

Out of scope: any change to `dispatch-ladder-advance`, `dispatch-ladder-await`,
`phase_is_done` (`:809-819`), `classify_terminus` (`:821-889`), `halt()`
(`:708-733`), or `SKILL.md`.

**Recommended model** — opus.

## Unit 2 — `dispatch-ladder-advance` emits 3, 15 and 16

**Scope**

- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-advance`:
  - `:247-250` — `refused <id> strategy` now `exit 3` (stdout line unchanged).
  - `:432-433` — `idle <id> ci-waiting` now `exit 15`.
  - `:437-438` — `idle <id> stale-selection` now `exit 16`.
  - `:442-443` — `idle <id> scope-stale-demoted` now `exit 16`.
  - `:227-229` — `idle <id> not-selectable` **stays** `exit 10`.
  - Header `Exit codes:` block at `:91-113`: document 3 / 15 / 16, restate 10 as
    the catch-all ("not selectable, and any future reason that does not warrant
    its own caller action"), and record the governing rule quoted in Context.
  - Header stdout block at `:64-90`: the `refused <id> strategy` entry's trailing
    "see exit code 2" (`:89`) becomes "see exit code 3".
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh`, using
  the existing `run_case` helper (`:164-188`, prefix-matching stdout):
  - `:226` `ci-waiting` expected exit `10` → `15`;
  - `:229` `stale-selection` `10` → `16`;
  - `:231-232` `scope-stale` `10` → `16`;
  - `:408-431` the strategy-refusal block: `[[ "$RC" == 2 …]]` → `== 3`, and its
    pass/fail message text.
  - Add a case asserting `not-selectable` still exits **10**, so the catch-all is
    pinned rather than incidental.
  - The three usage/validation cases at `:157-163` keep exit 2.

Out of scope: `dispatch-ladder-await`, `dispatch-ladder-run`, `SKILL.md`, and any
change to *which* reason `advance` reports for a given selector answer (that is
`tactic-eval-finding-ladder-ci-wait-swallows-blocked-node`'s territory — see
Out of Scope below).

**Recommended model** — sonnet.

**Dependencies** — Unit 1.

## Unit 3 — `dispatch-ladder-await` emits 17 for `pruned`

**Scope**

- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-await`:
  - `report_graph_verdict`'s `absent` arm at `:507-510` — the `pruned $NODE_ID$lag`
    line now `exit 17` (stdout unchanged, including the optional trailing
    ` reap_lag_s=<n>` field).
  - `advanced` (`:528-529`), `reviewed` (`:520-522`) and `lane-complete`
    (`:524-526`) **stay on exit 0**.
  - Header `Exit codes:` block at `:243-249`: rewrite the exit-0 entry to
    "advanced, reviewed or lane-complete — the loop may take another step", add
    `17  complete: the node is gone from origin/main — the run ends here`, and
    **generalize the existing lane-complete ruling rather than deleting it**:
    keep its reasoning verbatim and state the rule it is an instance of — a code
    is warranted iff the caller takes a distinct action, which is exactly why
    `lane-complete` stays on 0 and `pruned` moves off it.
  - `:88-90` and `:643-648` carry comments describing `pruned / parked / blocked`
    as "RUN-ENDING … (exit 0 / exit 11)"; update the code cited for `pruned`.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-await.sh`, using
  the existing `run_await` helper (`:148-163`) and `set_graph` (`:129-136`):
  - `:185` `run_await 0 "pruned $NODE" …` → `run_await 17 …`;
  - `:277` "a pruned node outranks a fresh stamp" → `17`;
  - `:374` "a pruned node is reported while the worker is still registered" → `17`;
  - `:199`, `:220`, `:254`, `:269` (advanced / reviewed / lane-complete) stay at 0.
  - Add an assertion that `advanced`, `reviewed` and `lane-complete` all still
    exit 0, so the deliberate sharing is pinned as a decision, not an accident.

Out of scope: the `verify-landed` stub (`:107-125`) needs no new predicate — the
`absent` answer already drives this arm.

**Recommended model** — sonnet.

**Dependencies** — Unit 1.

## Unit 4 — Delete the driver's string-matched control flow, and update the docs

**Scope**

- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run`:
  - Delete the `if [[ "$AW_DISP" == "pruned" ]]` control-flow branch at
    `:1414-1416`; the exit-0 arm now unconditionally `break`s. `AW_DISP` itself
    **stays** — it is read at `:1381` and is the `disposition` field of the
    `awaited` event at `:1398-1401`, which the evaluation reads.
  - Reduce the `10)` arm at `:1471-1523` to today's `*)` sub-arm body only
    (`:1513-1522`: `phase_is_done` → `halt 0 complete`, else `reconcile_pass` and
    its `RECONCILE_RESULT` case). Delete the inner `case "$REASON"` and both
    non-default sub-arms — they now live under `15)` and `16)` from Unit 1.
  - **Keep `REASON=$(awk '{print $3; exit}' <<<"$ADV_OUT")`, moved and
    re-commented.** It is still needed for the `${REASON:-unknown}` interpolation
    in the exit-10 halt message at `:1518` and for the `16)` arm's `log_event
    idle "$PHASE" "$REASON"` disposition (which distinguishes `stale-selection`
    from `scope-stale-demoted` in `events.jsonl`, asserted by the run suite).
    Add a comment stating that the parse is now **informational only** — it feeds
    the event log and operator text, and no branch may key on it again.
  - Header: rewrite `WHY EXIT 10 IS SPLIT BY REASON` (`:112-116`) as *why 10 is
    split by CODE*, keeping its concrete argument (halting on any `idle` would
    halt after every implement phase). Finish THE LOOP sketch (`:193-235`) and the
    EXIT CODES block (`:270-296`). Grep the whole file for cross-referenced line
    numbers into `advance`/`await` (e.g. `:95`, `:1229`, `:1253`, `:1258`) and fix
    every one that moved — this file treats those anchors as load-bearing
    documentation.
- `.claude/skills/dispatch-ladder/SKILL.md`:
  - Halt-dispositions table at `:296-310`: split the `2 | usage / refused` row
    into `2 | usage` and a new `3 | refused` row carrying the "run
    `/align-tactics` on the strategy id" remedy. Update the closing sentence at
    `:312-314` ("Every row above except `usage` / `refused` and `claimed` carries
    the synthesis") to name both rows.
  - "Stepping one phase by hand" at `:325-340`: `await` exit **20** and **21**
    are documented there; add `17` (`pruned`, the run ends) and `advance`'s
    `3 / 15 / 16`.
  - `:59` ("A strategy id is refused: `dispatch-ladder-advance` gates on the
    selector's own kind") — cite exit 3.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh`: delete or
  convert the legacy code-10 sub-reason cases at `:433-475` (`ci-waiting`,
  `stale-selection`, `scope-stale-demoted` arriving as exit 10), since after this
  unit exit 10 no longer splits. The `not-selectable` code-10 cases
  (`:255`, `:322`, `:388`, `:408`, `:488-489`, `:547-549`, `:571-574`, `:605`)
  all stay unchanged. Add one case asserting an exit-10 `idle <id>
  some-future-reason` still takes the reconcile-then-halt path — the catch-all
  defence.

Out of scope: `dispatch-ladder-status` (its `VERDICT_RC` at
`dispatch-ladder-status:129-176` is a deliberately independent 0/20/1 namespace
that never propagates the driver's code) and `dispatch-ladder-spawn` (it exits
`systemd-run`'s rc, `dispatch-ladder-spawn:180`, not the driver's). Neither
needs a change; do not touch them.

**Recommended model** — opus.

**Dependencies** — Units 1, 2 and 3.

---

## Explicitly out of scope for this node

Adjacent siblings that overlap. Read none of them as licence to widen here.

- `tactic-eval-finding-ladder-ci-wait-swallows-blocked-node` — `graph-select-target`
  collapses blocked / parked / done / absent / reviewed into one empty answer.
  That is the same under-differentiation **one layer up**, and it is why this plan
  does **not** add an "the node is done" code to `advance`: `advance` cannot know,
  because the selector does not tell it. Fixing that is that node's job.
- `tactic-eval-finding-ladder-halt-drops-captured-cause` — `ADV_ERR_LAST` is
  folded into the requeue event only. This plan preserves the existing fold
  verbatim and adds nothing.
- `tactic-eval-finding-halt-path-emits-no-timing-fields` — `halt()`'s event fields.
- `tactic-ladder-terminus-owns-main-qa` — `classify_terminus` and the
  merged-but-not-terminal census. Untouched here, deliberately.
- `tactic-ladder-await-phase-only-completion-test`,
  `tactic-ladder-await-interrupt-rung-vacuous-advanced` — await test coverage
  gaps. This plan adds only the exit-code assertions its own change requires.
- `tactic-detached-driver-owed-tick-sweeps` — `run_owed_sweeps`. Untouched.

## Known transition hazard

`dispatch-ladder-run` resolves its primitives from its own directory
(`dispatch-ladder-run:468-469`), so driver and primitives always move together on
disk — but a ladder **already detached and mid-run** when this lands will call
the new `advance` from the freshly-merged main checkout while executing the old
driver logic loaded at start. It will see 15/16/3 and take its `*) halt 1
internal` arm. That is a loud, visible halt with the unmapped code in the
message, not a silent misbehaviour; the recovery is re-spawning the ladder. Check
`systemctl --user list-units 'dispatch-ladder-*'` before merging, and re-spawn
any node whose run halted `internal` across the merge.

## Reuse

- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh:164-188`
  — `run_case <label> <select-line> <exec-line> <want-exit> <want-stdout-prefix>`;
  resets both `claude agents --json` registry views, the reservation dir and the
  pgrep stub per call. Every new advance exit-code row uses it as-is.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh:295-323`
  — `unverifiable_case()`, for a row that also needs a durable side-effect
  assertion (reservation marker retained vs cleared). Not needed by this plan,
  but the right shape if one arises.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh:144-161`
  — the `graph-select-target` / `dispatch-graph-execute` stubs (cat-a-file fakes
  driven by `$SELECT_OUT` / `$EXEC_OUT` / `$EXEC_RC`). No new stub plumbing is
  needed for any case in this plan.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-await.sh:129-136`
  and `:148-163` — `set_graph` (six rc files consumed by the `verify-landed` stub
  at `:107-125`, in deliberate order: `lane_pass` before `.phase`) and
  `run_await <want-exit> <want-stdout-prefix> <label> [extra args]`.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh:120-136`
  and `:190-194` — `make_seq_fake` / `set_seq`, which drive `advance`, `await`,
  `graph-auto-merge`, the reconcilers, `verify-landed`, `dispatch-spawn-job` and
  `git` from `<exit-code>|<stdout>` scripts. Every new run-level case is a
  `set_seq` row plus `assert_eq "$RC"`.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh:911-943` —
  the two existing `for pair in "<rc>|<line>"` passthrough loops. Extend these
  rather than writing new blocks.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:708-733` — `halt()`,
  the single terminal path. Every new arm halts through it; none writes its own
  `exit`, or it loses `classify_terminus`, `write_state` and the owed
  `spawn_phase_eval`.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:1398-1401` —
  `log_event <event> <phase> <disposition> <detail> [<fields-json>]`. New arms log
  through it so `events.jsonl` keeps its shape.
- `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:46-90` — the
  precedent numbering (10 ci-waiting / 12 stale-selection / 13 scope-stale) two
  layers below. Cited as a **caution, not a reuse**: 12 and 13 are already taken
  with other meanings one layer up.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:93-96` — the
  anti-pattern this change fixes one layer up: many per-node dispositions under
  one exit 0, carried only by stdout tokens. Correct *there* (it processes many
  nodes per call); wrong in a single-node primitive.

## Verification

All five ladder suites already run in CI
(`.github/workflows/unit-tests.yml:304-313`), so a red suite fails the PR without
any new wiring. Run them from the worktree root.

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-await.sh
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-spawn.sh
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-status.sh
```

The string-matched control flow is gone — both greps must find nothing:

```verify
if grep -n 'AW_DISP" == "pruned"' .claude/skills/dispatch-ladder/scripts/dispatch-ladder-run; then echo "FAIL: the forbidden pattern is still present in .claude/skills/dispatch-ladder/scripts/dispatch-ladder-run"; exit 1; fi
```

```verify
if grep -n 'case "$REASON" in' .claude/skills/dispatch-ladder/scripts/dispatch-ladder-run; then echo "FAIL: the forbidden pattern is still present in .claude/skills/dispatch-ladder/scripts/dispatch-ladder-run"; exit 1; fi
```

Every carved-out code is emitted by exactly the site it was carved from:

```verify
grep -c 'exit 15' .claude/skills/dispatch-ladder/scripts/dispatch-ladder-advance | grep -qx 1
```

```verify
grep -c 'exit 16' .claude/skills/dispatch-ladder/scripts/dispatch-ladder-advance | grep -qx 2
```

```verify
grep -c 'exit 3$' .claude/skills/dispatch-ladder/scripts/dispatch-ladder-advance | grep -qx 1
```

```verify
grep -c 'exit 17' .claude/skills/dispatch-ladder/scripts/dispatch-ladder-await | grep -qx 1
```

Project lint (prose rules + the type-safety escape check):

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

### Manual checks (judgment; not auto-runnable)

- **The doc table matches the code.** Read
  `.claude/skills/dispatch-ladder/SKILL.md:296-340` beside
  `dispatch-ladder-run:270-296` and confirm every code, disposition and remedy
  agrees. This project treats those anchors as load-bearing documentation, and a
  contract change whose docs drift is the defect this node exists to prevent.
- **No third meaning for a shared number.** Confirm by reading all three headers
  that no number means one thing in `advance` and another in `await`, other than
  the pre-existing, explicitly-documented `21` collision between
  `dispatch-ladder-await` (`held-observing`) and `dispatch-ladder-run`'s own
  caller-visible timeout — which this change must **not** extend to any new code.
- **The driver still decides nothing.** Re-read the new `15)` / `16)` / `3)` /
  `17)` arms against `dispatch-ladder-run:13-38` ("IT SEQUENCES; IT NEVER GATES")
  and the serving strategy's driver condition. Each arm must be a pure
  sequencing consequence of the primitive's answer — no new eligibility rule, no
  new retry policy, no new park. If an arm needed a rule to be written, the rule
  belongs in `graph-select-target`, and the arm is wrong.
- **A real end-to-end run.** After merge, spawn one node's ladder
  (`.claude/skills/dispatch-ladder/scripts/dispatch-ladder-spawn <node-id>`,
  `dangerouslyDisableSandbox: true`) and watch the journal
  (`journalctl --user -u dispatch-ladder-<node-id>.service`) plus
  `<main-root>/.claude/worktrees/<node-id>.ladder/events.jsonl` through at least
  one `ci-waiting` re-poll after `implement` opens its draft PR. The event
  disposition must still read `ci-waiting` (not `idle-wait`) — the token is the
  contract for `events.jsonl` readers and `/rsi`, and only the exit code changed.
- **Before merging**, check `systemctl --user list-units 'dispatch-ladder-*'` for
  in-flight drivers, per Known transition hazard above.

**Source PR**: #3072
